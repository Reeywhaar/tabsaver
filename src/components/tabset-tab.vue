<template>
	<span
		:title="link.url"
		class="tabsaver__tab-title"
		@click="openUrl"
	>{{link.url}}</span>
</template>

<script>
	import {DEFAULT_COOKIE_STORE_ID} from "../shared.js";

	export default {
		props: ["link"],
		mounted(){
			this.updateContainerProps();
		},
		updated(){
			this.updateContainerProps();
		},
		methods: {
			async updateContainerProps(){
				if(!this.link.cookieStoreId || this.link.cookieStoreId === DEFAULT_COOKIE_STORE_ID){
					delete this.$el.dataset.identityName;
					delete this.$el.dataset.identityColor;
					return;
				}

				const contextualIdentity = await browser.contextualIdentities.get(this.link.cookieStoreId);
				this.$el.dataset.identityName = contextualIdentity.name;
				this.$el.dataset.identityColor = contextualIdentity.color;
				this.$el.style.setProperty("--color", contextualIdentity.color);
			},
			async openUrl(){
				await this.$store.dispatch("openUrl", [this.link.url, this.link.cookieStoreId])
			},
		}
	}
</script>
