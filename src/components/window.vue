<template>
	<div class="main">
		<div class="save-new">
			<input
				class="save-new__input"
				type="text"
				v-model="newTabSetName"
				placeholder="Add TabSet"
				@keydown.enter="createTabSet"
			/>
			<button
				class="button save-new__button"
				title="Add TabSet"
				@click="createTabSet"
			>+</button>
		</div>
		<div class="content">
			<div class="tab-saver-items">
				<tabset
					v-for="tabset in items"
					:tabset="tabset"
					:key="tabset.key"
				></tabset>
			</div>
		</div>
		<div class="notification">{{notification}}</div>
		<div class="prefs">
			<label class="prefs__pinned" title="Include pinned tabs when saving"><input class="prefs__pinned-input" :checked="pinned" @change="togglePinned" type="checkbox">Pinned</label>
			<button @click="importData" class="inline-button prefs__import" title="Import from file">Import</button>
			<button @click="exportData" class="inline-button prefs__export" title="Export to file">Export</button>
		</div>
	</div>
</template>
<script>
	import TabSetComponent from "./tabset.vue";
	import {sleep, oneOf} from "../utils.js";

	export default {
		components: {
			"tabset": TabSetComponent,
		},
		data(){
			return {
				newTabSetName: "",
				notificationCounter: 0,
				notificationMessage: "",
			}
		},
		computed: {
			items(){
				return this.$store.getters.itemsReversed;
			},
			pinned(){
				return this.$store.state.pinned;
			},
			notification(){
				return this.$store.state.notification;
			},
		},
		async mounted(){
		},
		methods: {
			async importData(){
				this.$store.dispatch("import");
			},
			async exportData(){
				this.$store.dispatch("export");
			},
			async togglePinned(){
				this.$store.dispatch("togglePinned");
			},
			async createTabSet(){
				try{
					await this.$store.dispatch("tabsetCreate", this.newTabSetName)
				} catch (e) {
					if(oneOf(e.message, "Name exists", "TabSet is empty")){
						this.$store.dispatch("notify", e.message);
					}
					else if(e.message.indexOf("Set exists under name") === 0){
						this.$store.dispatch("notify", e.message);
					}
					else {
						this.$store.dispatch("notify", "Some error occured");
						console.error(e);
					}
				}
			},
			async renameTabSet([oldn, newn]){
				try{
					const d = await this.api.TabSet.rename(oldn, newn);
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
			}
		}
	}
</script>