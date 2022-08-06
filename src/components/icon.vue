<template>
  <span class="font-icon" v-html="text"></span>
</template>

<script>
const mapping = {
  add: 61543,
  close: 61453,
  gear: 61459,
  save: 61465,
  reload: 61470,
  open: 61587,
  undo: 61666,
  detach: 61772,
  pin: 61581,
};
export default {
  props: ["icon"],
  computed: {
    text() {
      return String.fromCharCode(mapping[this.icon]);
    },
  },
};
</script>
