<template>
  <div
    class="tabset window-tabset"
    @dragover="onDragover($event)"
    @dragend="onDragend($event)"
    @drop="onDrop($event)"
    :class="{'window-tabset-incognito': tabset.incognito}"
  >
    <div class="tabset__item" :style="{'background-color': headerColor}">
      <span class="tabset__title" @click="toggleCollapse">Window {{title}}</span>
      <span v-if="showCount" class="tabset__count">{{tabset.tabs.length}}</span>
      <div class="tabset__controls" :class="overlayClasses">
        <button
          class="inline-button tabset__button window-tabset__button tabset__button-add"
          @click="createTab()"
          title="Create Tab"
        >
          <icon icon="add"></icon>
        </button>
        <hold-button
          class="inline-button tabset__button window-tabset__button tabset__button-reload"
          @click="reloadAllTabs($event)"
          @cancel="onHoldCancel('reload all tabs')"
          title="Reload all tabs"
        >
          <icon icon="reload"></icon>
        </hold-button>
        <hold-button
          class="inline-button tabset__button window-tabset__button tabset__button-remove"
          @click="closeWindow()"
          @cancel="onHoldCancel('close window')"
          title="Close Window"
        >
          <icon icon="cross"></icon>
        </hold-button>
      </div>
    </div>
    <div class="tabset__links" v-if="!collapsed">
      <div v-if="tabset.tabs.length === 0" class="tabset__links-empty">No Tabs</div>
      <div
        v-for="tab in tabset.tabs"
        class="tabset__link-container"
        :class="{'tabsaver__tab-current': isCurrentTab(tab)}"
        :key="tab.url"
        draggable="true"
        @dragstart="onTabDrag($event, tab)"
      >
        <tabset-tab
          class="tabset__link"
          :link="tab"
          @mousedown.native="handleDown($event)"
          @mouseup.native="handleClick($event, tab)"
        ></tabset-tab>
        <button
          class="inline-button tabset__link-reload-button"
          title="Reload tab"
          @mousedown="reloadTab(tab, $event)"
        >
          <icon icon="reload"></icon>
        </button>
        <button
          class="inline-button tabset__link-remove-button"
          title="Remove tab"
          @click="closeTab(tab)"
        >
          <icon icon="cross"></icon>
        </button>
      </div>
    </div>
  </div>
</template>
<script>
import { sleep, first, parentMatching, eventYProportion } from "../utils.js";
import TabsetTabComponent from "./tabset-tab.vue";
import ColorSelectComponent from "./color-select.vue";
import HoldButtonComponent from "./hold-button.vue";
import IconComponent from "./icon.vue";

export default {
  props: ["tabset", "title"],
  components: {
    "tabset-tab": TabsetTabComponent,
    "hold-button": HoldButtonComponent,
    "color-select": ColorSelectComponent,
    icon: IconComponent
  },
  data() {
    let collapsed = true;
    if (
      this.$store.state.settings.expandWindows === 1 &&
      this.$props.tabset.focused
    ) {
      collapsed = false;
    }
    if (this.$store.state.settings.expandWindows === 2) {
      collapsed = false;
    }
    return {
      collapsed
    };
  },
  computed: {
    showCount() {
      return this.$store.state.settings.showCount;
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
      return first(this.$store.state.currentTabs, x => x.id === tab.id) === null
        ? false
        : true;
    },
    reloadTab(tab, event) {
      if (event.which === 2) {
        browser.tabs.duplicate(tab.id);
        return;
      }

      browser.tabs.reload(tab.id, {
        bypassCache: event.shiftKey
      });
    },
    reloadAllTabs(event) {
      for (let tab of this.$props.tabset.tabs) {
        browser.tabs.reload(tab.id, {
          bypassCache: event.shiftKey
        });
      }
    },
    closeTab(tab) {
      browser.tabs.remove(tab.id);
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
    handleDown(event) {
      if (event.which === 2) {
        event.preventDefault();
      }
    },
    async handleClick(event, tab) {
      if (event.which === 1) {
        event.preventDefault();
        await Promise.all([
          browser.tabs.update(tab.id, { active: true }),
          browser.windows.update(tab.windowId, { focused: true })
        ]);
      } else if (event.which === 2) {
        event.preventDefault();
        this.closeTab(tab);
      }
    },
    onTabDrag(event, tab) {
      const target = event.currentTarget;
      setTimeout(() => {
        target.classList.add("dnd__drag-target");
      }, 30);
      event.dataTransfer.setData("tabsaver/native-tab", JSON.stringify(tab));
    },
    onDragend(event) {
      event.target.classList.remove("dnd__drag-target");
      const tabs = this.$el.querySelectorAll(".tabset__link-container");
      for (let tab of tabs) {
        tab.classList.remove("dnd__drop-top", "dnd__drop-bottom");
      }
    },
    onDragover(event) {
      if (
        !event.dataTransfer.types.find(
          type => type === "tabsaver/native-tab" || type === "tabsaver/tab"
        )
      )
        return;

      event.preventDefault();

      const tabs = this.$el.querySelectorAll(".tabset__link-container");
      for (let tab of tabs) {
        if (event.target === tab || tab.contains(event.target)) {
          const after = eventYProportion(event, tab);

          tab.classList.remove(!after ? "dnd__drop-bottom" : "dnd__drop-top");
          tab.classList.add(after ? "dnd__drop-bottom" : "dnd__drop-top");
        } else {
          tab.classList.remove("dnd__drop-top", "dnd__drop-bottom");
        }
      }
    },
    onDrop(event) {
      const tabs = this.$el.querySelectorAll(".tabset__link-container");
      for (let tab of tabs) {
        tab.classList.remove("dnd__drop-top", "dnd__drop-bottom");
      }

      if (event.target.matches(".tabset__title")) {
        if (event.dataTransfer.types.indexOf("tabsaver/native-tab") !== -1) {
          const tab = JSON.parse(
            event.dataTransfer.getData("tabsaver/native-tab")
          );
          browser.tabs.move(tab.id, {
            index: -1,
            windowId: this.$props.tabset.id
          });
          return;
        } else {
          const tab = JSON.parse(event.dataTransfer.getData("tabsaver/tab"));
          for (let otab of this.$props.tabset.tabs) {
            if (
              otab.url === tab.tab.url &&
              otab.cookieStoreId === tab.tab.cookieStoreId
            ) {
              this.$store.dispatch("notify", "Tab Exists");
              return;
            }
          }

          browser.tabs
            .create({
              url: tab.tab.url,
              cookieStoreId: tab.tab.cookieStoreId
            })
            .catch(e => {
              browser.tabs.create({
                url: tab.tab.url
              });
            });
          return;
        }
      } else {
        const el = parentMatching(event.target, ".tabset__link-container");
        if (!el) return;
        const ch = this.$children.find(ch => el.contains(ch.$el));
        if (!ch) return;

        let append = eventYProportion(event, el) ? 1 : 0;

        if (event.dataTransfer.types.indexOf("tabsaver/native-tab") !== -1) {
          const tab = JSON.parse(
            event.dataTransfer.getData("tabsaver/native-tab")
          );

          if (
            tab.windowId === this.$props.tabset.id &&
            tab.index === ch.$props.link.index
          )
            return;

          if (
            tab.windowId === this.$props.tabset.id &&
            tab.index <= ch.$props.link.index
          ) {
            append -= 1;
          }

          browser.tabs.move(tab.id, {
            index: ch.$props.link.index + append,
            windowId: this.$props.tabset.id
          });
          return;
        } else {
          const tab = JSON.parse(event.dataTransfer.getData("tabsaver/tab"));
          browser.tabs
            .create({
              active: false,
              windowId: this.tabset.id,
              url: tab.tab.url,
              cookieStoreId: tab.tab.cookieStoreId,
              index: ch.$props.link.index + append
            })
            .catch(e => {
              browser.tabs.create({
                active: false,
                windowId: this.tabset.id,
                url: tab.tab.url,
                index: ch.$props.link.index + append
              });
            });
        }
      }
    },
    onHoldCancel(type) {
      this.$store.dispatch("notify", `Click and hold button to ${type}`);
    },
    async createTab() {
      let index;
      switch (this.$store.state.settings.placeCreatedTabs) {
        case 0:
          index = 0;
          break;
        case 1:
          index = null;
          break;
        case 2:
          index = null;
          for (const tab of this.$props.tabset.tabs) {
            if (this.isCurrentTab(tab)) {
              index = tab.index + 1;
              break;
            }
          }
          break;
      }
      browser.tabs.create({
        active: true,
        windowId: this.$props.tabset.id,
        index
      });
    },
    closeWindow() {
      browser.windows.remove(this.$props.tabset.id);
    }
  }
};
</script>
