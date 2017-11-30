<template>
	<div
		class="tab-saver-item"
	>
		<div class="tab-saver-item__item">
			<span
				class="tab-saver-item__title"
				@click="toggleCollapse"
				@dblclick="setEditable"
				@keydown.enter.prevent="rename()"
				:contenteditable="editable"
				title="Click to show stored tabs, double click to edit name"
			>{{tabset.key}}</span>
			<button @click="open" class="inline-button tab-saver-item__button tab-saver-item__button-open" title="Open TabSet"><icon icon="open"></icon></button>
			<button @click="addCurrentTab" class="inline-button tab-saver-item__button tab-saver-item__button-add" title="Add current tab to TabSet"><icon icon="add"></icon></button>
			<hold-button @click="save" class="inline-button tab-saver-item__button tab-saver-item__button-save" title="Save current window under selected TabSet"><icon icon="save"></icon></hold-button>
			<hold-button @click="remove" class="inline-button tab-saver-item__button tab-saver-item__button-remove" title="Remove TabSet"><icon icon="cross"></icon></hold-button>
			<button @click="moveDown" class="inline-button tab-saver-item__button tab-saver-item__button-down" title="Move down"><icon icon="arrow-down"></icon></button>
			<button class="inline-button tab-saver-item__button tab-saver-item__button-nodown" disabled><icon icon="arrow-down"></icon></button>
			<button @click="moveUp" class="inline-button tab-saver-item__button tab-saver-item__button-up" title="Move up"><icon icon="arrow-up"></icon></button>
			<button class="inline-button tab-saver-item__button tab-saver-item__button-noup" disabled><icon icon="arrow-up"></icon></button>
		</div>
		<div class="tab-saver-item__links" v-if="!collapsed">
			<div class="tab-saver-item__link-container" v-for="link in tabset.data" :key="link.url">
				<tabset-url
					class="tab-saver-item__link"
					:link="link"
				></tabset-url>
				<hold-button class="inline-button tab-saver-item__link-remove-button" @click="removeTab(link)"><icon icon="cross"></icon></hold-button>
				<button @click="moveTabDown(link)" class="inline-button tab-saver-item__link-move tab-saver-item__link-move-down" title="Move down"><icon icon="arrow-down"></icon></button>
				<button class="inline-button tab-saver-item__link-move tab-saver-item__link-move-nodown" disabled><icon icon="arrow-down"></icon></button>
				<button @click="moveTabUp(link)" class="inline-button tab-saver-item__link-move tab-saver-item__link-move-up" title="Move up"><icon icon="arrow-up"></icon></button>
				<button class="inline-button tab-saver-item__link-move tab-saver-item__link-move-noup" disabled><icon icon="arrow-up"></icon></button>
			</div>
		</div>
	</div>
</template>
<script>
	import {sleep} from "../utils.js";
	import TabsetUrlComponent from "./link.vue";
	import HoldButtonComponent from "./hold-button.vue";
	import IconComponent from "./icon.vue";

	export default {
		props: ["tabset"],
		components: {
			"tabset-url": TabsetUrlComponent,
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
				const windowId = await this.$store.dispatch("tabsetOpen", this.tabset.key);
				const currentWindow = await browser.windows.getCurrent();
				if(windowId === currentWindow.id){
					this.$store.dispatch("notify", "Tabset is open in current window");
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
			async moveUp(){
				try{
					await this.$store.dispatch("tabsetMoveup", this.tabset.key);
				} catch (e) {
					switch (e.message){
						case "Out of bound move":
							this.$store.dispatch("notify", "Cannot move top item");
							break;
						default:
							this.$store.dispatch("notify", "Some error occured");
					}
					console.error(e);
				};
			},
			async moveDown(){
				try{
					await this.$store.dispatch("tabsetMovedown", this.tabset.key);
				} catch (e) {
					switch (e.message){
						case "Out of bound move":
							this.$store.dispatch("notify", "Cannot move bottom item");
							break;
						default:
							this.$store.dispatch("notify", "Some error occured");
					}
					console.error(e);
				};
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