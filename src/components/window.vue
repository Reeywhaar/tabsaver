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
				<window-tabset
					v-for="(window, index) in windows"
					v-if="showWindows"
					:tabset="window"
					:key="window.id"
					:title="index + 1"
					class="tab-saver-items__tabset tab-saver-items__window-tabset"
					:class="{'tab-saver-items__window-tabset-current': isCurrentTabSet(window)}"
				></window-tabset>
				<div class="tab-saver-items__separator" v-if="windows.length > 0 && showWindows"></div>
				<tabset
					v-for="tabset in items"
					:tabset="tabset"
					:key="tabset.key"
					class="tab-saver-items__tabset"
					draggable="true"
					@dragstart.native="onTabSetDrag($event, tabset)"
					@dragover.native="onDragover($event)"
					@drop.native="onDrop($event, tabset)"
				></tabset>
			</div>
		</div>
		<div class="notification">{{notification}}</div>
		<div class="prefs">
			<div class="prefs__pinned" title="Include pinned tabs when saving">
				<toggle-button class="prefs__pinned-button" v-model="pinned">Save Pinned</toggle-button>
			</div>
			<hold-button @click="undo" class="inline-button prefs__undo" v-if="undoAvailable" title="Undo">Undo</hold-button>
			<button class="inline-button prefs__options-button" @click="openSettings()" title="Open preferences">⚙</button>
			<button class="inline-button prefs__detach-button" @click="detach()" title="Detach">➚</button>
		</div>
	</div>
</template>
<script>
import ToggleButtonComponent from "./toggle-button.vue";
import HoldButtonComponent from "./hold-button.vue";
import TabSetComponent from "./tabset.vue";
import WindowTabSetComponent from "./window-tabset.vue";
import { sleep, oneOf, first } from "../utils.js";

export default {
	components: {
		tabset: TabSetComponent,
		holdButton: HoldButtonComponent,
		toggleButton: ToggleButtonComponent,
		"window-tabset": WindowTabSetComponent,
	},
	data() {
		const hours = new Date().getHours();
		const daytime = hours >= 7 && hours < 20 ? "light" : "dark";
		return {
			newTabSetName: "",
			daytime,
		};
	},
	mounted() {
		setInterval(() => {
			const hours = new Date().getHours();
			this.daytime = hours >= 7 && hours < 20 ? "light" : "dark";
		}, 1000 * 60 * 10);
	},
	computed: {
		windows() {
			return this.$store.getters.windows;
		},
		showWindows() {
			return this.$store.state.settings.showWindows;
		},
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
		undoAvailable() {
			return this.$store.state.statesCount > 0;
		},
		notification() {
			return this.$store.state.notification;
		},
		mainClass() {
			if (this.$store.state.settings.theme === "daytime") {
				return [`main-theme-${this.daytime}`];
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
			e.dataTransfer.setData("tabsaver/tabset", tabset.key);
		},
		async onDrop(e, tabset) {
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
		onDragover(e) {
			for (let dtype of e.dataTransfer.types) {
				switch (dtype) {
					case "tabsaver/tabset":
						e.preventDefault();
						return;
				}
			}
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
		undo() {
			this.$store.dispatch("undo");
		},
		openSettings() {
			browser.runtime.openOptionsPage();
		},
		detach() {
			const url = browser.runtime.getURL(
				`./dist/sidebar.html?windowid=${this.$store.getters.currentWindow.id}`
			);
			browser.windows.create({
				url,
				type: "detached_panel",
				width: 250,
				height: 500,
				top: 0,
				left: 0,
			});
		},
		isCurrentTabSet(window) {
			const c = this.$store.getters.currentWindow;
			if (!c) return false;
			return c.id === window.id;
		},
	},
};
</script>
