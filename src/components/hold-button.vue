<template>
  <button @mousedown.prevent.stop="hold($event)" :style="style">
    <slot></slot>
  </button>
</template>

<script>
import { sleep } from "../utils.js";

export default {
  props: ["delay", "color", "hold-after"],
  emits: ["click", "cancel"],
  data() {
    return {
      progress: 0,
    };
  },
  computed: {
    delayWrapper() {
      return (parseFloat(this.delay) || 0.4) * 1000;
    },
    colorWrapper() {
      return this.color || "hsl(200, 50%, 80%)";
    },
    holdWrapper() {
      return this.holdAfter || 200;
    },
    style() {
      if (this.progress === 0) return {};
      return {
        background: `linear-gradient(90deg, ${this.colorWrapper}, ${this.colorWrapper} ${this.progress}%, transparent ${this.progress}%, transparent)`,
      };
    },
  },
  methods: {
    async hold(e) {
      const abortController = new AbortController();
      const progressWait = new Promise((resolve) => {
        const i = setInterval(() => {
          this.progress += 2;
          if (this.progress >= 100) {
            clearInterval(i);
            resolve();
          }
        }, this.delayWrapper / 50);
        abortController.signal.addEventListener("abort", () => {
          clearInterval(i);
          resolve("abort");
        });
      });
      const left = new Promise(async (resolve) => {
        const h = () => resolve("left");
        this.$el.addEventListener("mouseleave", h);
        await sleep(this.delayWrapper + this.holdWrapper);
        this.$el.removeEventListener("mouseleave", h);
      });
      const up = new Promise(async (resolve) => {
        const h = () => resolve("up");
        this.$el.addEventListener("mouseup", h);
        await sleep(this.delayWrapper + this.holdWrapper);
        this.$el.removeEventListener("mouseup", h);
      });
      const hold = new Promise(async (resolve) => {
        await progressWait;
        await sleep(this.holdWrapper);
        resolve("hold");
      });
      const result = await Promise.race([left, up, hold]);
      abortController.abort();
      this.progress = 0;
      this.$emit(result === "hold" ? "click" : "cancel");
    },
  },
};
</script>
