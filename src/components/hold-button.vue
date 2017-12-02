<template>
	<button @mousedown.prevent.stop="hold($event)" :style="style"><slot></slot></button>
</template>

<script>
	import {sleep} from "../utils.js";

	export default {
		props: ["delay", "color"],
		data(){
			return {
				progress: 0,
			};
		},
		computed: {
			delayWrapper(){
				return (parseFloat(this.delay) || .4) * 1000;
			},
			colorWrapper(){
				return this.color || "hsl(200, 50%, 80%)";
			},
			style(){
				if(this.progress === 0) return {};
				return {
					background: `linear-gradient(90deg, ${this.colorWrapper}, ${this.colorWrapper} ${this.progress}%, transparent ${this.progress}%, transparent)`,
				};
			},
		},
		methods: {
			async hold(e){
				const interval = setInterval(() => {
					this.progress += 4;
				}, this.delayWrapper / 50);
				const left = new Promise(async resolve => {
					const h = () => resolve("left");
					this.$el.addEventListener("mouseleave", h);
					await sleep(this.delayWrapper);
					this.$el.removeEventListener("mouseleave", h);
				});
				const up = new Promise(async resolve => {
					const h = () => resolve("up");
					this.$el.addEventListener("mouseup", h);
					await sleep(this.delayWrapper);
					this.$el.removeEventListener("mouseup", h);
				});
				const hold = new Promise(async resolve => {
					await sleep(this.delayWrapper)
					resolve("hold");
				});
				const result = await Promise.race([left, up, hold])
				clearInterval(interval);
				this.progress = 0;
				if(result === "hold"){
					this.$emit("click", e);
				};
			},
		},
	};
</script>