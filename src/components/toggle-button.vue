<template>
	<span class="toggle-button" @click="onClick" :data-state="state"><slot></slot></span>
</template>

<script>
export default {
	props: {
		color: {
			default: "hsl(0, 90%, 70%)",
		},
		value: {
			type: Boolean,
			required: true,
		},
	},
	computed: {
		state() {
			return this.$props.value ? "on" : "off";
		},
	},
	methods: {
		onClick(e) {
			this.$emit("input", !this.$props.value);
		},
	},
};
</script>