<template>
  <div class="options">
    <div class="options__section">
      <label class="options__row">
        <input
          class="options__left-checkbox"
          type="checkbox"
          v-model="showWindows"
        />Show window TabSets
      </label>
      <div class="options__row indent-1" :class="{ disabled: !showWindows }">
        <span>Expand window TabSets in </span>
        <select class="browser-style" v-model.number="expandWindows">
          <option value="0">None</option>
          <option value="1">Current window</option>
          <option value="2">All windows</option>
        </select>
      </div>
      <div class="options__row indent-1" :class="{ disabled: !showWindows }">
        <span>Place created tab </span>
        <select class="browser-style" v-model.number="placeCreatedTabs">
          <option value="0">at start</option>
          <option value="1">at end</option>
          <option value="2">after current tab</option>
        </select>
      </div>
    </div>
    <div class="options__section options__row">
      <span>When opening a tab, check for the same tab in&ensp;</span>
      <select class="browser-style" v-model.number="tabLookup">
        <option value="0">Nowhere</option>
        <option value="1">Current window</option>
        <option value="2">All windows</option>
      </select>
    </div>
    <div class="options__section">
      <label title="Open non-window tabs in new window">
        <input
          class="options__left-checkbox"
          type="checkbox"
          v-model="openInNewTab"
        />Open tab in new tab
      </label>
      <div class="comment indent-1">
        * tabs with different containers will still be opened in different tabs
        (due to api limitation)
      </div>
    </div>
    <div class="options__section">
      <label>
        <input
          class="options__left-checkbox"
          type="checkbox"
          v-model="includePinned"
        />Include pinned tabs when saving TabSet
      </label>
    </div>
    <div class="options__section">
      <label>
        <input
          class="options__left-checkbox"
          type="checkbox"
          v-model="showFavicons"
        />Show tabs’ favicons
      </label>
      <div class="comment indent-1">
        * favicons caching is not implemented yet, which results in multiple
        requests while rendering TabSet tab. Also may be a privacy concern
      </div>
    </div>
    <div class="options__section">
      <label>
        <input
          class="options__left-checkbox"
          type="checkbox"
          v-model="showTitles"
        />Show tabs’ titles
      </label>
    </div>
    <div class="options__section">
      <label>
        <input
          class="options__left-checkbox"
          type="checkbox"
          v-model="showCount"
        />Show tabs’ count
      </label>
    </div>
    <div class="options__section">
      <label class="options__row">
        <input
          class="options__left-checkbox"
          type="checkbox"
          v-model="useHistory"
        />Use history
      </label>
      <div class="history-options indent-1" :class="{ disabled: !useHistory }">
        <div class="options__row options__section">
          <label>
            Number of history states
            <input
              class="options__states-counter"
              type="number"
              name="choices"
              min="1"
              max="100"
              v-model.number="numberOfHistoryStates"
            />
          </label>
        </div>
        <div class="options__row history-options__states-count">
          States count: {{ statesCount }}
        </div>
        <div class="options__row comment">
          * Lot of states may abuse your hard drive, especially if you have a
          lot TabSets with a lot of tabs in them.
        </div>
        <div class="options__row comment">
          Value between 10 and 30 is optimal
        </div>
      </div>
    </div>
    <div class="options__section options__buttons-section">
      <button class="button" @click="importTabsets">Import TabSets</button>
      <button class="button" @click="exportTabsets">Export TabSets</button>
      <hold-button
        class="button clear-tabsets-button"
        color="hsla(10, 90%, 50%)"
        delay="2"
        @click="clearTabsets"
        >Clear TabSets</hold-button
      >
    </div>
    <div class="options__section links">
      <h3>
        <a :href="usageLink">Show Usage</a>
      </h3>
      <h3>
        <a :href="faqLink">Show Faq</a>
      </h3>
      <h3>
        <a :href="changelogLink">Show Changelog</a>
      </h3>
    </div>
    <div class="options__section credits">
      <h3>Credits</h3>
      <p>This project takes best of these products:</p>
      <ul class="credits-list">
        <li class="credits-list__item">
          <a href="https://vuejs.org/">
            <strong>Vue.js</strong>
          </a>
          reactive framework
        </li>
        <li class="credits-list__item">
          <a href="https://github.com/flitbit/diff">
            <strong>deep-diff</strong>
          </a>
          library
        </li>
      </ul>
    </div>
  </div>
</template>
<script>
import HoldButton from "./hold-button.vue";
import { sleep, oneOf, readFileAsJson } from "../utils.js";

function createProperty(prop) {
  return {
    get() {
      return this.$store.state.settings[prop];
    },
    set(value) {
      this.$store.dispatch("setSetting", {
        key: prop,
        value,
      });
    },
  };
}

export default {
  components: {
    HoldButton,
  },
  data() {
    const version = browser.runtime.getManifest().version;
    const usageLink = `https://github.com/Reeywhaar/tabsaver/tree/${version}#screenshots`;
    const faqLink = `https://github.com/Reeywhaar/tabsaver/tree/${version}#faq`;
    const changelogLink = `https://github.com/Reeywhaar/tabsaver#changelog`;

    return {
      version,
      usageLink,
      faqLink,
      changelogLink,
    };
  },
  computed: {
    includePinned: createProperty("includePinned"),
    showFavicons: createProperty("showFavicons"),
    showTitles: createProperty("showTitles"),
    showCount: createProperty("showCount"),
    showWindows: createProperty("showWindows"),
    openInNewTab: createProperty("openInNewTab"),
    expandWindows: createProperty("expandWindows"),
    placeCreatedTabs: createProperty("placeCreatedTabs"),
    tabLookup: createProperty("tabLookup"),
    useHistory: createProperty("useHistory"),
    numberOfHistoryStates: createProperty("numberOfHistoryStates"),
    statesCount() {
      return this.$store.state.statesCount;
    },
  },
  methods: {
    async importTabsets() {
      const imported = await readFileAsJson();
      this.$store.dispatch("import", imported);
    },
    exportTabsets() {
      this.$store.dispatch("export");
    },
    clearTabsets() {
      this.$store.dispatch("clearTabsets");
    },
  },
};
</script>
