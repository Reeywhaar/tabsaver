<template>
	<span class="font-icon" v-html="text"></span>
</template>

<script>
const mapping = {
	open: "&#xe2c6;",
	add: "&#xe146;",
	save: "&#xe884;",
	cross: "&#xea0f;",
	"arrow-up": "&#xea32;",
	"arrow-down": "&#xea36;",
};
export default {
	props: ["icon"],
	computed: {
		text() {
			return mapping[this.icon];
		},
	},
};
</script>