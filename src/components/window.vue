<template>
  <div class="main">
    <div class="save-new">
      <input
        class="save-new__input"
        type="text"
        v-model="newTabSetName"
        placeholder="Add TabSet"
        @keydown.enter="createTabSet"
      />
      <button
        class="button save-new__button"
        title="Add TabSet"
        @click="createTabSet"
      >
        <icon icon="add"></icon>
      </button>
    </div>
    <div class="content" :style="contentStyle">
      <div class="tabsets">
        <window-tabset
          v-for="(window, index) in windows"
          v-if="showWindows"
          :tabset="window"
          :key="window.id"
          :title="index + 1"
          class="tabsets__tabset tabsets__window-tabset"
          :class="{ 'tabsets__window-tabset-current': isCurrentTabSet(window) }"
        ></window-tabset>
        <div
          class="tabsets__separator"
          v-if="windows.length > 0 && showWindows"
        ></div>
        <tabset
          v-for="tabset in items"
          :tabset="tabset"
          :key="tabset.key"
          class="tabsets__tabset"
          draggable="true"
          @dragstart.native="onTabSetDrag($event, tabset)"
          @dragover.native="onDragover($event)"
          @drop.native="onDrop($event, tabset)"
          @dragend.native="onDragend($event, tabset)"
          @dragleave.native="onDragleave($event, tabset)"
        ></tabset>
      </div>
    </div>
    <div class="notification">{{ notification }}</div>
    <div class="prefs">
      <div class="prefs__pinned" title="Include pinned tabs when saving">
        <toggle-button class="prefs__pinned-button" v-model="pinned"
          >Save Pinned</toggle-button
        >
      </div>
      <hold-button
        @click="undo"
        class="inline-button prefs__button"
        v-if="undoAvailable"
        title="Undo"
      >
        <icon class="prefs__icon" icon="undo"></icon>
      </hold-button>
      <button
        class="inline-button prefs__button prefs__options-button"
        @click="openSettings()"
        title="Open preferences"
      >
        <icon class="prefs__icon" icon="gear"></icon>
      </button>
      <button
        class="inline-button prefs__button prefs__detach-button"
        @click="detach()"
        title="Detach"
      >
        <icon class="prefs__icon" icon="detach"></icon>
      </button>
    </div>
  </div>
</template>
<script>
import ToggleButtonComponent from "./toggle-button.vue";
import HoldButtonComponent from "./hold-button.vue";
import TabSetComponent from "./tabset.vue";
import IconComponent from "./icon.vue";
import WindowTabSetComponent from "./window-tabset.vue";
import { sleep, oneOf, eventYProportion } from "../utils.js";

export default {
  components: {
    tabset: TabSetComponent,
    holdButton: HoldButtonComponent,
    toggleButton: ToggleButtonComponent,
    icon: IconComponent,
    "window-tabset": WindowTabSetComponent,
  },
  data() {
    const hours = new Date().getHours();
    const daytime = hours >= 7 && hours < 20 ? "light" : "dark";
    return {
      newTabSetName: "",
      daytime,
    };
  },
  mounted() {
    setInterval(() => {
      const hours = new Date().getHours();
      this.daytime = hours >= 7 && hours < 20 ? "light" : "dark";
    }, 1000 * 60 * 10);
  },
  computed: {
    windows() {
      return this.$store.getters.windows;
    },
    showWindows() {
      return this.$store.state.settings.showWindows;
    },
    items() {
      return this.$store.getters.itemsReversed;
    },
    pinned: {
      get() {
        return this.$store.state.settings.includePinned;
      },
      set(value) {
        this.$store.dispatch("setSetting", {
          key: "includePinned",
          value,
        });
      },
    },
    undoAvailable() {
      return this.$store.state.statesCount > 0;
    },
    notification() {
      return this.$store.state.notification;
    },
    contentStyle() {
      return {
        minHeight: `${Math.min(this.$store.state.items.length, 15)}em`,
      };
    },
  },
  methods: {
    onTabSetDrag(e, tabset) {
      if (
        !e.target.querySelector(".tabset__title") ||
        !e.target
          .querySelector(".tabset__title")
          .matches(".tabset__title:hover")
      ) {
        e.preventDefault();
        return;
      }
      const target = e.currentTarget;
      setTimeout(() => {
        target.classList.add("dnd__drag-target");
      }, 30);
      e.dataTransfer.setData("tabsaver/tabset", tabset.key);
    },
    onDragend(e, tabset) {
      e.target.classList.remove("dnd__drag-target");
    },
    onDragleave(event, tabset) {
      event.currentTarget.classList.remove("dnd__drop-top", "dnd__drop-bottom");
    },
    async onDrop(e, tabset) {
      e.currentTarget.classList.remove("dnd__drop-top", "dnd__drop-bottom");
      try {
        if (e.dataTransfer.types.indexOf("tabsaver/tabset") !== -1) {
          const key = e.dataTransfer.getData("tabsaver/tabset");
          if (!key || key === tabset.key) return;

          e.stopPropagation();

          const after = eventYProportion(e);

          await this.$store.dispatch("tabsetMove", [key, tabset.key, after]);
        } else if (e.dataTransfer.types.indexOf("tabsaver/native-tab") !== -1) {
          const tab = JSON.parse(e.dataTransfer.getData("tabsaver/native-tab"));

          await this.$store.dispatch("tabsetAppend", [tabset.key, tab]);
        } else if (e.dataTransfer.types.indexOf("tabsaver/tab") !== -1) {
          const data = JSON.parse(e.dataTransfer.getData("tabsaver/tab"));
          if (!data.key) throw new Error("Can't find tab's TabSet");
          if (!data.tab) throw new Error("Can't find tab");
          if (data.key === tabset.key) return;

          e.stopPropagation();

          if (tabset.data.length === 0) {
            await this.$store.dispatch("tabsetAppend", [tabset.key, data.tab]);
            await this.$store.dispatch("tabsetRemoveTab", [data.key, data.tab]);
          } else {
            await this.$store.dispatch("tabsetMoveTab", [
              data.key,
              data.tab,
              tabset.key,
              tabset.data[tabset.data.length - 1],
              true,
            ]);
          }
        }
      } catch (e) {
        this.$store.dispatch("notify", e.message);
        console.error(e);
      }
    },
    onDragover(event) {
      const type = event.dataTransfer.types.find(
        (type) =>
          type === "tabsaver/native-tab" ||
          type === "tabsaver/tab" ||
          type === "tabsaver/tabset"
      );

      if (!type) return;

      event.stopPropagation();
      event.preventDefault();

      if (type === "tabsaver/tabset") {
        const after = eventYProportion(event);

        event.currentTarget.classList.add(
          !after ? "dnd__drop-top" : "dnd__drop-bottom"
        );
        event.currentTarget.classList.remove(
          after ? "dnd__drop-top" : "dnd__drop-bottom"
        );
      }
    },
    async importData() {
      this.$store.dispatch("import");
    },
    async exportData() {
      this.$store.dispatch("export");
    },
    async createTabSet() {
      try {
        await this.$store.dispatch("tabsetCreate", this.newTabSetName);
      } catch (e) {
        if (oneOf(e.message, "Name exists", "TabSet is empty")) {
          this.$store.dispatch("notify", e.message);
        } else if (e.message.indexOf("Set exists under name") === 0) {
          this.$store.dispatch("notify", e.message);
        } else {
          this.$store.dispatch("notify", "Some error occured");
          console.error(e);
        }
      }
    },
    async renameTabSet([oldn, newn]) {
      try {
        const d = await this.api.TabSet.rename(oldn, newn);
      } catch (e) {
        if (e.message === "Name already exists") {
          this.$store.dispatch("notify", e.message);
          throw e;
        } else if (e.message === "Unknown TabSet") {
          this.$store.dispatch("notify", e.message);
        } else {
          this.$store.dispatch("notify", "Some error occured");
          console.error(e);
        }
      }
    },
    undo() {
      this.$store.dispatch("undo");
    },
    openSettings() {
      browser.runtime.openOptionsPage();
    },
    detach() {
      const url = browser.runtime.getURL(
        `./dist/sidebar.html?windowid=${this.$store.getters.currentWindow.id}`
      );
      browser.windows.create({
        url,
        type: "detached_panel",
        width: 250,
        height: 500,
        top: 0,
        left: 0,
      });
    },
    isCurrentTabSet(window) {
      const c = this.$store.getters.currentWindow;
      if (!c) return false;
      return c.id === window.id;
    },
  },
};
</script>
