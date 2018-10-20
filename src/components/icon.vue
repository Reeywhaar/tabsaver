<template>
	<span class="font-icon" v-html="text"></span>
</template>

<script>
const mapping = {
	open: "&#xe2c6;",
	add: "&#xe145;",
	save: "&#xe884;",
	cross: "&#xea0f;",
	reload: "&#xe5d5;",
	undo: "&#xe965;",
	detach: "&#xea33;",
	cog: "&#xe8b8;",
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