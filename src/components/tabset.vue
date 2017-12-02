<template>
	<div class="tab-saver-item">
		<div class="tab-saver-item__item">
			<span
				class="tab-saver-item__title"
				@click="toggleCollapse"
				@dblclick="setEditable"
				@keydown.enter.prevent="rename()"
				@focusout.stop="rename()"
				:contenteditable="editable"
				title="Click to show stored tabs, double click to edit name"
			>{{tabset.key}}</span>
			<button @click="open" class="inline-button tab-saver-item__button tab-saver-item__button-open" title="Open TabSet"><icon icon="open"></icon></button>
			<button @click="addCurrentTab" class="inline-button tab-saver-item__button tab-saver-item__button-add" title="Add current tab to TabSet"><icon icon="add"></icon></button>
			<hold-button @click="save" class="inline-button tab-saver-item__button tab-saver-item__button-save" title="Save current window under selected TabSet"><icon icon="save"></icon></hold-button>
			<hold-button @click="remove" class="inline-button tab-saver-item__button tab-saver-item__button-remove" title="Remove TabSet"><icon icon="cross"></icon></hold-button>
		</div>
		<div class="tab-saver-item__links" v-if="!collapsed">
			<div
				v-if="tabset.data.length === 0"
				class="tab-saver-item__links-empty"
				@dragover.stop="onTabDragover($event)"
				@drop.stop="onEmptyTabDrop($event)"
			>No Tabs</div>
			<div
				class="tab-saver-item__link-container"
				v-for="tab in tabset.data"
				:key="tab.url"
				draggable="true"
				@dragover.stop="onTabDragover($event)"
				@dragstart.stop="onTabDrag($event, tab)"
				@drop="onTabDrop($event, tab)"
			>
				<tabset-tab
					class="tab-saver-item__link"
					:link="tab"
				></tabset-tab>
				<hold-button class="inline-button tab-saver-item__link-remove-button" @click="removeTab(tab)"><icon icon="cross"></icon></hold-button>
			</div>
		</div>
	</div>
</template>
<script>
	import {sleep} from "../utils.js";
	import TabsetTabComponent from "./tabset-tab.vue";
	import HoldButtonComponent from "./hold-button.vue";
	import IconComponent from "./icon.vue";

	export default {
		props: ["tabset"],
		components: {
			"tabset-tab": TabsetTabComponent,
			"hold-button": HoldButtonComponent,
			"icon": IconComponent,
		},
		data(){
			return {
				collapsed: true,
				editable: false,
			}
		},
		mounted(){
		},
		methods: {
			onTabDrag(e, tab){
				if(!e.target.querySelector(".tab-saver-item__link").matches(".tab-saver-item__link:hover")){
					e.preventDefault();
					return;
				};
				e.dataTransfer.setData('tabsaver/tabset/key', this.tabset.key);
				e.dataTransfer.setData('tabsaver/tabset/tab', JSON.stringify(tab));
				e.dataTransfer.setData('text/plain', tab.url);
			},
			async onTabDrop(e, tab){
				try {
					const key = e.dataTransfer.getData("tabsaver/tabset/key");
					const serializedTab = e.dataTransfer.getData("tabsaver/tabset/tab");
					if(!key && !serializedTab) return e;
					if(!key) throw new Error("Can't find tab's TabSet");
					if(!serializedTab) throw new Error("Can't find tab");
					if(key === this.tabset.key && serializedTab === JSON.stringify(tab)) return;

					e.stopPropagation();

					const after = (() => {
						const rect = e.currentTarget.getBoundingClientRect();
						const y = e.clientY - rect.y;
						const proportion = y / rect.height * 100;
						return proportion >= 50 ? true : false;
					})();

					await this.$store.dispatch("tabsetMoveTab", [
						key,
						JSON.parse(serializedTab),
						this.tabset.key,
						tab,
						after,
					]);
				} catch (e) {
					this.$store.dispatch("notify", e.message);
					console.error(e);
				};
			},
			async onEmptyTabDrop(e){
				try{
					const key = e.dataTransfer.getData("tabsaver/tabset/key");
					const serializedTab = e.dataTransfer.getData("tabsaver/tabset/tab");
					if(!key) throw new Error("Can't find tab's TabSet");
					if(!serializedTab) throw new Error("Can't find tab");

					await this.$store.dispatch("tabsetAppend", [
						this.tabset.key,
						JSON.parse(serializedTab),
					]);
					await this.$store.dispatch("tabsetRemoveTab", [
						key,
						JSON.parse(serializedTab),
					]);
				} catch (e) {
					this.$store.dispatch("notify", e.message);
					console.error(e);
				};
			},
			onTabDragover(e){
				e.preventDefault();
			},
			async toggleCollapse(){
				await sleep(30)
				if(this.editable) return;
				this.collapsed = !this.collapsed;
				this.$emit(this.collapsed ? "collapsed" : "expanded", this.tabset);
			},
			collapse(){
				this.collapsed = true;
				this.$emit("collapsed", this.tabset);
			},
			async setEditable(){
				if(this.editable){
					this.rename();
					return;
				};
				this.editable = true;
				await sleep(30);
				this.$el.querySelector(".tab-saver-item__title").focus();
				document.execCommand("selectAll", false, null);
				this.$emit("editable", this.tabset);
			},
			setUneditable(){
				this.editable = false;
				this.$emit("uneditable", this.tabset);
			},
			async open(){
				try{
					const windowId = await this.$store.dispatch("tabsetOpen", this.tabset.key);
					const currentWindow = await browser.windows.getCurrent();
					if(windowId === currentWindow.id){
						this.$store.dispatch("notify", "Tabset is open in current window");
					};
				} catch (e) {
					if(e.message === "Trying to open empty TabSet"){
						this.$store.dispatch("notify", e.message);
						return;
					};
					this.$store.dispatch("notify", "Some error occured");
					console.error(e);
				};
			},
			async save(){
				try{
					await this.$store.dispatch("tabsetSave", this.tabset.key);
					this.$store.dispatch("notify", `"${this.tabset.key}" saved`);
				} catch (e) {
					if(e.message === "Unknown TabSet"){
						this.$store.dispatch("notify", e.message);
					} else if(e.message === "TabSet is empty") {
						this.$store.dispatch("notify", "Window have no tabs");
					} else {
						this.$store.dispatch("notify", "Some error occured");
						console.error(e);
					}
				}
			},
			async rename(){
				try{
					const oldn = this.tabset.key;
					const newn = this.$el.querySelector(".tab-saver-item__title").textContent;
					if(oldn !== newn){
						await this.$store.dispatch("tabsetRename", [oldn, newn]);
					};
					this.setUneditable();
					await sleep(30);
					this.$el.querySelector(".tab-saver-item__title").blur();
					window.getSelection().removeAllRanges();
				} catch (e) {
					if(e.message === "Name already exists"){
						this.$store.dispatch("notify", e.message);
						throw e;
					}
					else if(e.message === "Unknown TabSet"){
						this.$store.dispatch("notify", e.message);
					} else {
						this.$store.dispatch("notify", "Some error occured");
						console.error(e);
					}
				}
			},
			async remove(){
				try{
					await this.$store.dispatch("tabsetRemove", this.tabset.key);
					this.$store.dispatch("notify", `"${this.tabset.key}" removed`);
				} catch (e) {
					if(e.message === "Unknown TabSet"){
						this.$store.dispatch("notify", e.message);
					} else {
						this.$store.dispatch("notify", "Some error occured");
						console.error(e);
					}
				}
			},
			async addCurrentTab(){
				try{
					await this.$store.dispatch("tabsetAppend", this.tabset.key);
				} catch (e) {
					this.$store.dispatch("notify", e.message);
					console.error(e);
				}
			},
			async removeTab(tab){
				try{
					await this.$store.dispatch("tabsetRemoveTab", [this.tabset.key, tab]);
				} catch (e) {
					this.$store.dispatch("notify", e.message);
					console.error(e);
				}
			},
			async moveTabDown(tab){
				try{
					await this.$store.dispatch("tabsetMoveTabDown", [this.tabset.key, tab]);
				} catch (e) {
					this.$store.dispatch("notify", e.message);
					console.error(e);
				}
			},
			async moveTabUp(tab){
				try{
					await this.$store.dispatch("tabsetMoveTabUp", [this.tabset.key, tab]);
				} catch (e) {
					this.$store.dispatch("notify", e.message);
					console.error(e);
				}
			},
		}
	}
</script>