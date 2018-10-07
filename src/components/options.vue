<template>
	<div class="panel-section panel-section-formElements options ">
		<div class="panel-formElements-item options__section">
			<label><input type="checkbox" name="choices" value="op1"/>Show tabs' titles</label>
		</div>
		<div class="panel-formElements-item options__section">
			<label><input type="checkbox" name="choices" value="op1"/>Use history</label>
		</div>
		<div class="panel-formElements-item options__section indent-1">
			<label>Number of history states <input type="number" name="choices" min="2" max="100" value="10"/></label>
		</div>
		<div class="panel-formElements-item options__section">
			<span>Theme&ensp;</span><select class="browser-style" name="select">
				<option value="value1">Light</option>
			</select>
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
		pinned() {
			return this.$store.state.pinned;
		},
		notification() {
			return this.$store.state.notification;
		},
	},
	async mounted() {},
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
		async togglePinned() {
			this.$store.dispatch("togglePinned");
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
