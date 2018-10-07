<template>
	<div class="color-select" :style="style" :data-state="state">
		<div
			class="color-select__item"
			v-for="item in colors" :key="item"
			:class="{'color-select__item-current': isCurrent(item)}"
			:style="{'background-color': item}"
			@click="setColor(item)"
		></div>
	</div>
</template>

<script>
export default {
	props: {
		colors: {
			default: [
				"hsla(0, 0%, 0%, 0)",
				"hsl(10, 90%, 70%)",
				"hsl(40, 100%, 70%)",
				"hsl(60, 90%, 70%)",
				"hsl(120, 90%, 70%)",
				"hsl(200, 90%, 70%)",
				"hsl(240, 90%, 70%)",
				"hsl(280, 90%, 70%)",
				"hsl(320, 90%, 70%)",
			],
			type: Array,
		},
		value: {
			type: Boolean,
			required: true,
		},
	},
	computed: {
		safeColor() {
			return this.$props.colors.indexOf(this.$props.value) > -1
				? this.$props.value
				: "hsla(0, 0%, 0%, 0)";
		},
	},
	methods: {
		isCurrent(color) {
			return color === this.safeColor;
		},
		setColor(color) {
			if (color === this.$props.value) return;
			if (color === "hsla(0, 0%, 0%, 0)") color = null;
			this.$emit("input", color);
		},
	},
};
</script>
