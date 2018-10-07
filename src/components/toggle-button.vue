<template>
	<span class="toggle-button" @click="onClick" :style="style" :data-state="state"><slot></slot></span>
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
		style() {
			return this.$props.value
				? {
						backgroundColor: this.$props.color,
				  }
				: {};
		},
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