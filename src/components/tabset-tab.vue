<template>
	<span
		:title="link.url"
		class="tabsaver__tab-title"
	><img :src="link.favIconUrl" class="tabsaver__tab-title-favicon" @error="hideFavicon" v-if="showFavicons"> {{title}}</span>
</template>

<script>
import { DEFAULT_COOKIE_STORE_ID } from "../shared.js";

export default {
	props: ["link"],
	mounted() {
		this.updateContainerProps();
	},
	updated() {
		this.updateContainerProps();
	},
	data() {
		return { faviconError: false };
	},
	computed: {
		showFavicons() {
			return (
				this.$store.state.settings.showFavicons &&
				this.$props.link.favIconUrl &&
				!this.faviconError
			);
		},
		title() {
			if (
				this.$store.state.settings.showTitles &&
				this.$props.link.title &&
				this.$props.link.title.length > 0
			) {
				return `${this.$props.link.title} (${this.$props.link.url})`;
			}
			return this.$props.link.url;
		},
	},
	methods: {
		hideFavicon() {
			this.faviconError = true;
		},
		async updateContainerProps() {
			if (
				!this.link.cookieStoreId ||
				this.link.cookieStoreId === DEFAULT_COOKIE_STORE_ID
			) {
				delete this.$el.dataset.identityName;
				delete this.$el.dataset.identityColor;
				return;
			}

			try {
				const contextualIdentity = await browser.contextualIdentities.get(
					this.link.cookieStoreId
				);
				this.$el.dataset.identityName = contextualIdentity.name;
				this.$el.dataset.identityColor = contextualIdentity.color;
				this.$el.style.setProperty("--color", contextualIdentity.color);
			} catch (e) {
				this.$el.dataset.identityName = "Unknown";
				this.$el.dataset.identityColor = "hsl(0, 0%, 70%)";
				this.$el.style.setProperty("--color", "hsl(0, 0%, 70%)");
			}
		},
	},
};
</script>
