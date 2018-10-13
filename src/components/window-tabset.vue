<template>
	<div
	class="tab-saver-item"
	@dragover="onDragover($event)"
	@drop="onDrop($event)"
	>
		<div class="tab-saver-item__item" :style="{'background-color': headerColor}">
			<span
				class="tab-saver-item__title"
				@click="toggleCollapse"
			>Window {{title}}</span><span v-if="showCount" class="tab-saver-item__count">{{tabset.tabs.length}}</span>
			<div class="tab-saver-item__controls" :class="overlayClasses">
			</div>
		</div>
		<div class="tab-saver-item__links" v-if="!collapsed">
			<div
				v-if="tabset.tabs.length === 0"
				class="tab-saver-item__links-empty"
			>No Tabs</div>
			<div
				v-for="tab in tabset.tabs"
				class="tab-saver-item__link-container"
				:class="{'tabsaver__tab-current': isCurrentTab(tab)}"
				:key="tab.url"
				draggable="true"
				@dragstart="onTabDrag($event, tab)"
			>
				<tabset-tab
					class="tab-saver-item__link"
					:link="tab"
					@mousedown.native="handleDown($event)"
					@mouseup.native="handleClick($event, tab)"
				></tabset-tab>
				<button class="inline-button tab-saver-item__link-remove-button" title="Remove tab" @click="closeTab(tab)"><icon icon="cross"></icon></button>
			</div>
		</div>
	</div>
</template>
<script>
import { sleep } from "../utils.js";
import TabsetTabComponent from "./tabset-tab.vue";
import ColorSelectComponent from "./color-select.vue";
import HoldButtonComponent from "./hold-button.vue";
import IconComponent from "./icon.vue";

export default {
	props: ["tabset", "title"],
	components: {
		"tabset-tab": TabsetTabComponent,
		"hold-button": HoldButtonComponent,
		"color-select": ColorSelectComponent,
		icon: IconComponent,
	},
	data() {
		let collapsed = true;
		if (
			this.$store.state.settings.expandWindows === 1 &&
			this.$props.tabset.focused
		) {
			collapsed = false;
		}
		if (this.$store.state.settings.expandWindows === 2) {
			collapsed = false;
		}
		return {
			collapsed,
		};
	},
	computed: {
		showCount() {
			return this.$store.state.settings.showCount;
		},
		overlayPosition() {
			return this.$store.state.settings.overlayPosition;
		},
		overlayClasses() {
			return [`tab-saver-item__controls-${this.overlayPosition}`];
		},
	},
	methods: {
		isCurrentTab(tab) {
			try {
				if (this.$store.state.currentTab === browser.tabs.TAB_ID_NONE)
					return false;
				return tab.id === this.$store.state.currentTab.id;
			} catch (e) {
				return false;
			}
		},
		closeTab(tab) {
			browser.tabs.remove(tab.id);
		},
		async toggleCollapse() {
			await sleep(30);
			if (this.editable) return;
			this.collapsed = !this.collapsed;
			this.$emit(this.collapsed ? "collapsed" : "expanded", this.tabset);
		},
		collapse() {
			this.collapsed = true;
			this.$emit("collapsed", this.tabset);
		},
		handleDown(event) {
			if (event.which === 2) {
				event.preventDefault();
			}
		},
		async handleClick(event, tab) {
			if (event.which === 1) {
				event.preventDefault();
				await Promise.all([
					browser.tabs.update(tab.id, { active: true }),
					browser.windows.update(tab.windowId, { focused: true }),
				]);
			} else if (event.which === 2) {
				event.preventDefault();
				this.closeTab(tab);
			}
		},
		onTabDrag(event, tab) {
			event.dataTransfer.setData("tabsaver/native-tab", JSON.stringify(tab));
		},
		onDragover(event) {
			for (let type of event.dataTransfer.types) {
				switch (type) {
					case "tabsaver/native-tab":
					case "tabsaver/tab":
						event.preventDefault();
						return;
				}
			}
		},
		onDrop(event) {
			if (event.dataTransfer.types.indexOf("tabsaver/native-tab") !== -1) {
				const tab = JSON.parse(
					event.dataTransfer.getData("tabsaver/native-tab")
				);
				if (event.target.matches(".tab-saver-item__title")) {
					browser.tabs.move(tab.id, {
						index: -1,
						windowId: this.$props.tabset.id,
					});
				} else if (event.target.matches(".tab-saver-item__link")) {
					for (let ch of this.$children) {
						if (event.target === ch.$el) {
							let append = (() => {
								const rect = ch.$el.getBoundingClientRect();
								const y = event.clientY - rect.y;
								const proportion = (y / rect.height) * 100;
								return proportion < 70 ? 0 : 1;
							})();

							if (
								tab.windowId === this.$props.tabset.id &&
								tab.index === ch.$props.link.index
							) {
								return;
							}

							if (
								tab.windowId === this.$props.tabset.id &&
								tab.index <= ch.$props.link.index
							) {
								append -= 1;
							}

							browser.tabs.move(tab.id, {
								index: ch.$props.link.index + append,
								windowId: this.$props.tabset.id,
							});
							return;
						}
					}
				}
			} else if (event.dataTransfer.types.indexOf("tabsaver/tab") !== -1) {
				const tab = JSON.parse(event.dataTransfer.getData("tabsaver/tab"));
				for (let otab of this.$props.tabset.tabs) {
					if (
						otab.url === tab.tab.url &&
						otab.cookieStoreId === tab.tab.cookieStoreId
					) {
						this.$store.dispatch("notify", "Tab Exists");
						return;
					}
				}

				if (event.target.matches(".tab-saver-item__title")) {
					browser.tabs.create({
						url: tab.tab.url,
						cookieStoreId: tab.cookieStoreId,
					});
				} else if (event.target.matches(".tab-saver-item__link")) {
					for (let ch of this.$children) {
						if (event.target === ch.$el) {
							let append = (() => {
								const rect = ch.$el.getBoundingClientRect();
								const y = event.clientY - rect.y;
								const proportion = (y / rect.height) * 100;
								return proportion < 70 ? 0 : 1;
							})();

							browser.tabs.create({
								active: false,
								windowId: this.tabset.id,
								url: tab.tab.url,
								cookieStoreId: tab.cookieStoreId,
								index: ch.$props.link.index + append,
							});
						}
					}
				}
			}
		},
	},
};
</script>
