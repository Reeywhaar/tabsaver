<template>
  <div class="tabset" v-if="tabset">
    <div class="tabset__item" :style="{'background-color': headerColor}">
      <span
        class="tabset__title"
        @click="toggleCollapse"
        @dblclick="setEditable"
        @keydown.enter.prevent="rename()"
        @focusout.stop="rename()"
        :contenteditable="editable"
        title="Click to show stored tabs, double click to edit name"
      >{{tabset.key}}</span>
      <span v-if="showCount" class="tabset__count">{{tabset.data.length}}</span>
      <div class="tabset__controls" :class="overlayClasses">
        <color-select class="tabset__color-select" :value="tabset.color" @input="setColor($event)"></color-select>
        <button
          @click="open()"
          class="inline-button tabset__button tabset__button-open"
          title="Open TabSet"
        >
          <icon icon="open"></icon>
        </button>
        <button
          @click="addCurrentTab()"
          class="inline-button tabset__button tabset__button-add"
          title="Add current tab to TabSet"
        >
          <icon icon="add"></icon>
        </button>
        <hold-button
          @click="save()"
          @cancel="onHoldCancel('save TabSet')"
          class="inline-button tabset__button tabset__button-save"
          title="Save current window under selected TabSet"
        >
          <icon icon="save"></icon>
        </hold-button>
        <hold-button
          @click="remove()"
          @cancel="onHoldCancel('remove TabSet')"
          class="inline-button tabset__button tabset__button-remove"
          title="Remove TabSet"
        >
          <icon icon="cross"></icon>
        </hold-button>
      </div>
    </div>
    <div class="tabset__links" v-if="!collapsed">
      <div
        v-if="tabset.data.length === 0"
        class="tabset__links-empty"
        @dragover="onTabDragover($event)"
        @drop="onTabDrop($event, null)"
      >No Tabs</div>
      <div
        v-for="(tab, index) in tabset.data"
        class="tabset__link-container"
        :class="{'tabsaver__tab-current': isCurrentTab(tab)}"
        :key="tab.url"
        draggable="true"
        :data-index="index"
        @dragstart.stop="onTabDrag($event, tab)"
        @dragover="onTabDragover($event)"
        @dragleave="onTabDragLeave($event)"
        @dragend="onTabDragEnd($event)"
        @drop="onTabDrop($event, tab)"
      >
        <tabset-tab
          class="tabset__link"
          :link="tab"
          @mousedown.native="handleDown($event)"
          @mouseup.native="handleClick($event, tab)"
        ></tabset-tab>
        <hold-button
          class="inline-button tabset__link-remove-button"
          title="Remove tab"
          @click="removeTab(tab)"
          @cancel="onHoldCancel('remove tab')"
        >
          <icon icon="cross"></icon>
        </hold-button>
      </div>
    </div>
  </div>
</template>
<script>
import { sleep, firstIndex, first, eventYProportion } from "../utils.js";
import TabsetTabComponent from "./tabset-tab.vue";
import ColorSelectComponent from "./color-select.vue";
import HoldButtonComponent from "./hold-button.vue";
import IconComponent from "./icon.vue";

export default {
  props: ["tabset"],
  components: {
    "tabset-tab": TabsetTabComponent,
    "hold-button": HoldButtonComponent,
    "color-select": ColorSelectComponent,
    icon: IconComponent
  },
  data() {
    return {
      collapsed: true,
      editable: false
    };
  },
  computed: {
    showCount() {
      return this.$store.state.settings.showCount;
    },
    headerColor() {
      if (!this.$props.tabset) return null;
      if (!this.$props.tabset.color) return null;
      return `hsla(${this.$props.tabset.color}, 100%, 60%, 0.4)`;
    },
    overlayPosition() {
      return this.$store.state.settings.overlayPosition;
    },
    overlayClasses() {
      return [`tabset__controls-${this.overlayPosition}`];
    }
  },
  methods: {
    isCurrentTab(tab) {
      if (this.$store.getters.currentWindow === null) return false;
      return first(
        this.$store.state.currentTabs,
        x =>
          x.windowId === this.$store.getters.currentWindow.id &&
          tab.url === x.url &&
          tab.cookieStoreId === x.cookieStoreId
      ) === null
        ? false
        : true;
    },
    onTabDrag(e, tab) {
      if (
        !e.target.querySelector(".tabset__link").matches(".tabset__link:hover")
      ) {
        e.preventDefault();
        return;
      }

      const target = e.currentTarget;
      setTimeout(() => {
        target.classList.add("dnd__drag-target");
      }, 30);

      e.dataTransfer.setData(
        "tabsaver/tab",
        JSON.stringify({
          key: this.tabset.key,
          tab
        })
      );
      e.dataTransfer.setData("text/plain", tab.url);
    },
    async onTabDrop(e, tab) {
      e.currentTarget.classList.remove("dnd__drop-top", "dnd__drop-bottom");

      try {
        if (
          e.dataTransfer.types.indexOf("tabsaver/tab") === -1 &&
          e.dataTransfer.types.indexOf("tabsaver/native-tab") === -1
        )
          return;

        if (e.currentTarget.matches(".tabset__links-empty")) {
          if (e.dataTransfer.types.indexOf("tabsaver/native-tab") !== -1) {
            const tab = JSON.parse(
              e.dataTransfer.getData("tabsaver/native-tab")
            );

            await this.$store.dispatch("tabsetAppend", [this.tabset.key, tab]);
            return;
          } else if (e.dataTransfer.types.indexOf("tabsaver/tab") !== -1) {
            const data = JSON.parse(e.dataTransfer.getData("tabsaver/tab"));
            if (!data.key) throw new Error("Can't find tab's TabSet");
            if (!data.tab) throw new Error("Can't find tab");

            await this.$store.dispatch("tabsetAppend", [
              this.tabset.key,
              data.tab
            ]);
            await this.$store.dispatch("tabsetRemoveTab", [data.key, data.tab]);
            return;
          }
        }

        if (e.currentTarget.matches(".tabset__link-container")) {
          e.stopPropagation();

          const after = eventYProportion(e);

          if (e.dataTransfer.types.indexOf("tabsaver/tab") !== -1) {
            const data = JSON.parse(e.dataTransfer.getData("tabsaver/tab"));
            if (!data.key) throw new Error("Can't find tab's TabSet");
            if (!data.tab) throw new Error("Can't find tab");
            if (
              data.key === this.tabset.key &&
              data.tab.url === tab.url &&
              data.tab.cookieStoreId === tab.cookieStoreId
            )
              return;

            await this.$store.dispatch("tabsetMoveTab", [
              data.key,
              data.tab,
              this.tabset.key,
              tab,
              after
            ]);
            return;
          } else if (
            e.dataTransfer.types.indexOf("tabsaver/native-tab") !== -1
          ) {
            const tab = JSON.parse(
              e.dataTransfer.getData("tabsaver/native-tab")
            );
            const tabExists =
              first(
                this.tabset.data,
                x => x.url === tab.url && x.cookieStoreId === tab.cookieStoreId
              ) !== null;

            if (tabExists) {
              this.$store.dispatch("notify", "Tab Exists");
              return;
            }

            const index = parseInt(e.currentTarget.dataset.index, 10);

            await this.$store.dispatch("tabsetAppend", [
              this.tabset.key,
              tab,
              index + after
            ]);
            return;
          }
        }
      } catch (e) {
        this.$store.dispatch("notify", e.message);
        console.error(e);
      }
    },
    onTabDragover(event) {
      const type = event.dataTransfer.types.find(
        type => type === "tabsaver/native-tab" || type === "tabsaver/tab"
      );

      if (!type) return;

      event.preventDefault();

      const tab = event.currentTarget;
      const after = eventYProportion(event, tab);

      tab.classList.remove(!after ? "dnd__drop-bottom" : "dnd__drop-top");
      tab.classList.add(after ? "dnd__drop-bottom" : "dnd__drop-top");
    },
    onTabDragEnd(event) {
      event.target.classList.remove("dnd__drag-target");
      event.currentTarget.classList.remove("dnd__drop-top", "dnd__drop-bottom");
    },
    onTabDragLeave(event) {
      event.currentTarget.classList.remove("dnd__drop-top", "dnd__drop-bottom");
    },
    onHoldCancel(type) {
      this.$store.dispatch("notify", `Click and hold button to ${type}`);
    },
    async toggleCollapse() {
      await sleep(30);
      if (this.editable) return;
      this.collapsed = !this.collapsed;
      this.$emit(this.collapsed ? "collapsed" : "expanded", this.tabset);
    },
    collapse() {
      this.collapsed = true;
      this.$emit("collapsed", this.tabset);
    },
    async setEditable() {
      if (this.editable) {
        this.rename();
        return;
      }
      this.editable = true;
      await sleep(30);
      this.$el.querySelector(".tabset__title").focus();
      document.execCommand("selectAll", false, null);
      this.$emit("editable", this.tabset);
    },
    setUneditable() {
      this.editable = false;
      this.$emit("uneditable", this.tabset);
    },
    async open() {
      try {
        const windowId = await this.$store.dispatch(
          "tabsetOpen",
          this.tabset.key
        );
        const currentWindow = await browser.windows.getCurrent();
        if (windowId === currentWindow.id) {
          this.$store.dispatch("notify", "Tabset is open in current window");
        }
      } catch (e) {
        if (e.message === "Trying to open empty TabSet") {
          this.$store.dispatch("notify", e.message);
          return;
        }
        this.$store.dispatch("notify", "Some error occured");
        console.error(e);
      }
    },
    async save(tabs = null) {
      try {
        await this.$store.dispatch("tabsetSave", {
          key: this.tabset.key,
          color: this.tabset.color,
          tabs
        });
        // this.$store.dispatch("notify", `"${this.tabset.key}" saved`);
      } catch (e) {
        if (e.message === "Unknown TabSet") {
          this.$store.dispatch("notify", e.message);
        } else if (e.message === "TabSet is empty") {
          this.$store.dispatch("notify", "Window have no tabs");
        } else {
          this.$store.dispatch("notify", "Some error occured");
          console.error(e);
        }
      }
    },
    async rename() {
      try {
        const oldn = this.tabset.key;
        const newn = this.$el.querySelector(".tabset__title").textContent;
        if (oldn !== newn) {
          await this.$store.dispatch("tabsetRename", [oldn, newn]);
        }
        this.setUneditable();
        await sleep(30);
        this.$el.querySelector(".tabset__title").blur();
        window.getSelection().removeAllRanges();
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
    async remove() {
      try {
        await this.$store.dispatch("tabsetRemove", this.tabset.key);
        this.$store.dispatch("notify", `"${this.tabset.key}" removed`);
      } catch (e) {
        if (e.message === "Unknown TabSet") {
          this.$store.dispatch("notify", e.message);
        } else {
          this.$store.dispatch("notify", "Some error occured");
          console.error(e);
        }
      }
    },
    async addCurrentTab() {
      try {
        await this.$store.dispatch("tabsetAppend", this.tabset.key);
        this.$store.dispatch("notify", `Tab added to "${this.tabset.key}"`);
      } catch (e) {
        this.$store.dispatch("notify", e.message);
        console.error(e);
      }
    },
    async removeTab(tab) {
      try {
        await this.$store.dispatch("tabsetRemoveTab", [this.tabset.key, tab]);
      } catch (e) {
        this.$store.dispatch("notify", e.message);
        console.error(e);
      }
    },
    async moveTabDown(tab) {
      try {
        await this.$store.dispatch("tabsetMoveTabDown", [this.tabset.key, tab]);
      } catch (e) {
        this.$store.dispatch("notify", e.message);
        console.error(e);
      }
    },
    async moveTabUp(tab) {
      try {
        await this.$store.dispatch("tabsetMoveTabUp", [this.tabset.key, tab]);
      } catch (e) {
        this.$store.dispatch("notify", e.message);
        console.error(e);
      }
    },
    async setColor(color) {
      if (color === this.tabset.color) return;
      this.tabset.color = color;
      await this.save(this.tabset.data);
    },
    async openTab(tab) {
      await this.$store.dispatch("openUrl", [tab.url, tab.cookieStoreId]);
    },
    handleDown(event) {
      if (event.which === 2) {
        event.preventDefault();
      }
    },
    async handleClick(event, tab) {
      this.openTab(tab);
    }
  }
};
</script>
