<template>
  <span class="toggle-button" @click="onClick" :data-state="state"
    ><slot></slot
  ></span>
</template>

<script>
export default {
  props: {
    color: {
      default: "hsl(0, 90%, 70%)",
    },
    modelValue: {
      type: Boolean,
      required: true,
    },
  },
  emits: ["update:modelValue"],
  computed: {
    state() {
      return this.$props.modelValue ? "on" : "off";
    },
  },
  methods: {
    onClick(e) {
      this.$emit("update:modelValue", !this.$props.modelValue);
    },
  },
};
</script>
