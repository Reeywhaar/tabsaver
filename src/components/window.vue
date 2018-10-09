<template>
	<div class="main" :class="mainClass">
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
		<div class="content" :style="contentStyle">
			<div class="tab-saver-items">
				<tabset
					v-for="tabset in items"
					:tabset="tabset"
					:key="tabset.key"
					class="tab-saver-items__tabset"
					draggable="true"
					@dragover.native.stop="onTabSetDragover($event)"
					@dragstart.native.stop="onTabSetDrag($event, tabset)"
					@drop.native="onTabSetDrop($event, tabset)"
				></tabset>
			</div>
		</div>
		<div class="notification">{{notification}}</div>
		<div class="prefs">
			<div class="prefs__pinned" title="Include pinned tabs when saving">
				<toggle-button class="prefs__pinned-button" v-model="pinned">Save Pinned</toggle-button>
			</div>
			<button @click="importData" class="inline-button prefs__import" title="Import from file">Import</button>
			<button @click="exportData" class="inline-button prefs__export" title="Export to file">Export</button>
		</div>
	</div>
</template>
<script>
import ToggleButtonComponent from "./toggle-button.vue";
import TabSetComponent from "./tabset.vue";
import { sleep, oneOf, first } from "../utils.js";

export default {
	components: {
		tabset: TabSetComponent,
		toggleButton: ToggleButtonComponent,
	},
	data() {
		return {
			newTabSetName: "",
		};
	},
	computed: {
		items() {
			return this.$store.getters.itemsReversed;
		},
		pinned: {
			get() {
				return this.$store.state.settings.includePinned;
			},
			set(value) {
				this.$store.dispatch("setSetting", {
					key: "includePinned",
					value,
				});
			},
		},
		notification() {
			return this.$store.state.notification;
		},
		mainClass() {
			if (this.$store.state.settings.theme === "daytime") {
				const hours = new Date().getHours;
				const theme = hours >= 7 && hours < 20 ? "light" : "dark";
				return [`main-theme-${theme}`];
			}
			return [`main-theme-${this.$store.state.settings.theme}`];
		},
		contentStyle() {
			return {
				minHeight: `${Math.min(this.$store.state.items.length, 15)}em`,
			};
		},
	},
	methods: {
		onTabSetDrag(e, tabset) {
			if (
				!e.target.querySelector(".tab-saver-item__title") ||
				!e.target
					.querySelector(".tab-saver-item__title")
					.matches(".tab-saver-item__title:hover")
			) {
				e.preventDefault();
				return;
			}
			this.$children.forEach(ch => {
				if (ch.tabset) ch.collapse();
			});
			e.dataTransfer.setData("tabsaver/tabset", tabset.key);
		},
		async onTabSetDrop(e, tabset) {
			try {
				const key = e.dataTransfer.getData("tabsaver/tabset");
				if (!key || key === tabset.key) return;

				e.stopPropagation();

				const after = (() => {
					const rect = e.currentTarget.getBoundingClientRect();
					const y = e.clientY - rect.y;
					const proportion = (y / rect.height) * 100;
					return proportion >= 50 ? true : false;
				})();

				await this.$store.dispatch("tabsetMove", [key, tabset.key, after]);
			} catch (e) {
				this.$store.dispatch("notify", e.message);
				console.error(e);
			}
		},
		onTabSetDragover(e) {
			e.preventDefault();
		},
		async importData() {
			this.$store.dispatch("import");
		},
		async exportData() {
			this.$store.dispatch("export");
		},
		async createTabSet() {
			try {
				await this.$store.dispatch("tabsetCreate", this.newTabSetName);
			} catch (e) {
				if (oneOf(e.message, "Name exists", "TabSet is empty")) {
					this.$store.dispatch("notify", e.message);
				} else if (e.message.indexOf("Set exists under name") === 0) {
					this.$store.dispatch("notify", e.message);
				} else {
					this.$store.dispatch("notify", "Some error occured");
					console.error(e);
				}
			}
		},
		async renameTabSet([oldn, newn]) {
			try {
				const d = await this.api.TabSet.rename(oldn, newn);
			} catch (e) {
				if (e.message === "Name already exists") {
					this.$store.dispatch("notify", e.message);
					throw e;
				} else if (e.message === "Unknown TabSet") {
					this.$store.dispatch("notify", e.message);
				} else {
					this.$store.dispatch("notify", "Some error occured");
					console.error(e);
				}
			}
		},
	},
};
</script>
