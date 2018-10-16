<template>
	<div class="color-select" :style="style" :data-state="state">
		<div
			class="color-select__item"
			:class="{'color-select__item-current': isCurrent(null)}"
			:style="{'background-color': 'hsla(0,0%,0%,0)'}"
			@click="setColor(null)"
		></div><div
			class="color-select__item"
			v-for="item in hues" :key="item"
			:class="{'color-select__item-current': isCurrent(item)}"
			:style="{'background-color': hsl(item)}"
			@click="setColor(item)"
		></div>
	</div>
</template>

<script>
export default {
	props: {
		hues: {
			default: [340, 10, 40, 55, 90, 200, 240, 280],
			type: Array,
		},
		value: {
			type: Boolean,
			required: true,
		},
	},
	computed: {
		safeColor() {
			return this.$props.hues.indexOf(this.$props.value) > -1
				? this.$props.value
				: null;
		},
	},
	methods: {
		hsl(hue) {
			return `hsla(${hue}, 90%, 60%, 1)`;
		},
		isCurrent(color) {
			return color === this.safeColor;
		},
		setColor(color) {
			if (color === this.$props.value) return;
			this.$emit("input", color);
		},
	},
};
</script>
