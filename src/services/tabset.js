import { oneOf, getKey, padLeft, setsAreEqual } from "../utils.js";
import {
  storage,
  getMangledURL,
  getUnmangledURL,
  DEFAULT_COOKIE_STORE_ID,
  PRIVATE_COOKIE_STORE_ID,
} from "../shared.js";

export class TabSet {
  async getAll() {
    return storage.get("tabs", []);
  }

  async saveAll(tabs) {
    await storage.set("tabs", tabs);
  }

  async save(key, tabs, color = null, size) {
    const tabsData = tabs
      .map((x) => this.serializeTab(x))
      .filter((x) => !oneOf(x.url, "about:blank", "about:newtab"))
      .map((x) => {
        x.url = getUnmangledURL(x.url);
        return x;
      });
    if (tabsData.length === 0) throw new Error("TabSet is empty");
    const d = await this.getAll();
    const existing = d.find((x) => {
      return x.key === key;
    });
    if (existing) {
      existing.data = tabsData;
      existing.color = color;
      existing.size = size;
    } else {
      d.push({
        key,
        data: tabsData,
        color,
        size,
      });
    }
    await this.saveAll(d);
  }

  async add(key, tabs, size) {
    if (key === null || key === "") {
      key = this.getDefaultTabSetName();
    }
    const d = await this.getAll();
    if (d.find((x) => x.key === key)) throw new Error("Name exists");

    for (let set of d) {
      if (
        this.tabSetsAreEqual(
          set.data.map((x) => getUnmangledURL(x.url)),
          tabs.map((x) => getUnmangledURL(x.url))
        )
      ) {
        throw new Error(`Set exists under name "${set.key}"`);
      }
    }
    return this.save(key, tabs, undefined, size);
  }

  async open(key) {
    const tabset = (await this.getAll()).find((x) => x.key === key);
    if (tabset === null) throw new Error("Unknown TabSet");

    const windows = await browser.windows.getAll({ populate: true });
    for (let window of windows) {
      if (
        this.tabSetsAreEqual(
          tabset.data.map((x) => x.url),
          window.tabs.map((x) => getUnmangledURL(x.url))
        )
      ) {
        await browser.windows.update(window.id, { focused: true });
        return window.id;
      }
    }
    const allowedTabs = tabset.data.map((x) => {
      x.url = getMangledURL(x.url);
      return x;
    });
    if (allowedTabs.length === 0) {
      throw new Error("Trying to open empty TabSet");
    }
    const window = await browser.windows.create({
      width: tabset.size ? tabset.size[0] : undefined,
      height: tabset.size ? tabset.size[1] : undefined,
    });
    const tabNeedToBeClosed = window.tabs[0];
    for (const [index, tab] of allowedTabs.entries()) {
      const props = {
        url: tab.url,
        windowId: window.id,
        pinned: getKey(tab, "pinned", false),
        cookieStoreId: getKey(tab, "cookieStoreId", DEFAULT_COOKIE_STORE_ID),
        active: false,
      };
      try {
        await browser.tabs.create(props);
      } catch (e) {
        if (e.message.indexOf("No cookie store exists with ID") === 0) {
          props.url = `/dist/handler.html?url=${encodeURIComponent(
            tab.url
          )}&containerRemoved=true`;
          props.cookieStoreId = DEFAULT_COOKIE_STORE_ID;
          await browser.tabs.create(props);
        } else {
          throw e;
        }
      }
      if (index === 0) await browser.tabs.remove(tabNeedToBeClosed.id);
    }
    return window.id;
  }

  async rename(oldn, newn) {
    const d = await this.getAll();

    const newExists =
      d.findIndex((x) => {
        return x.key === newn;
      }) !== -1;
    if (newExists) throw new Error("Name already exists");

    const index = d.findIndex((x) => {
      return x.key === oldn;
    });
    if (index === -1) throw new Error("Unknown TabSet");

    d[index].key = newn;
    await this.saveAll(d);
  }

  async remove(name) {
    const d = await this.getAll();
    const index = d.findIndex((x) => {
      return x.key === name;
    });
    if (index === -1) throw new Error("Unknown TabSet");

    d.splice(index, 1);
    await this.saveAll(d);
  }

  async moveTabSet(tabsetName, targetName, after = true) {
    if (tabsetName === targetName) return;
    const d = await this.getAll();
    const a = this.findTabSet(d, tabsetName);
    if (!a) throw new Error("Original doesn't exists");
    const b = this.findTabSet(d, targetName);
    if (!b) throw new Error("Target doesn't exists");
    const cut = d.splice(d.indexOf(a), 1);
    d.splice(d.indexOf(b) + (after ? 0 : 1), 0, cut[0]);
    await this.saveAll(d);
  }

  async appendTab(tabsetName, passedTab = null, index = -1) {
    const tab =
      passedTab ||
      (await browser.tabs.query({ active: true, currentWindow: true }))[0];
    if (!tab) {
      throw new Error("Invalid tab");
    }
    if (tab.id === browser.tabs.TAB_ID_NONE) {
      throw new Error("Invalid tab");
    }
    if (oneOf(tab.url, "about:blank", "about:newtab")) {
      throw new Error("Trying to add blank page");
    }

    const tabData = this.serializeTab(tab);
    const d = await this.getAll();
    const tabset = d.find((x) => x.key === tabsetName);
    if (tabset === null) throw new Error("TabSet doesn't exist");

    if (tabset.data.find((x) => this.tabsEqual(x, tabData)))
      throw new Error("Tab already exists");

    if (index === -1) {
      tabset.data.push(tabData);
    } else {
      tabset.data.splice(index, 0, tabData);
    }
    await this.saveAll(d);
  }

  async removeTab(tabsetName, tab) {
    const d = await this.getAll();
    const tabset = d.find((x) => x.key === tabsetName);
    const index = tabset.data.findIndex((x) => this.tabsEqual(x, tab));
    if (index === -1) {
      throw new Error("Tab doesn't exist");
    }
    tabset.data.splice(index, 1);
    await this.saveAll(d);
  }

  async moveTab(
    donorTabsetKey,
    donorTab,
    targetTabsetKey,
    targetTab,
    after = true
  ) {
    if (
      donorTabsetKey === targetTabsetKey &&
      this.tabsEqual(donorTab, targetTab)
    )
      return;
    const d = await this.getAll();
    const donorTabset = this.findTabSet(d, donorTabsetKey);
    if (donorTabset === null) throw new Error("Original TabSet doesn't exists");
    const targetTabset =
      donorTabsetKey === targetTabsetKey
        ? donorTabset
        : this.findTabSet(d, targetTabsetKey);
    if (!targetTabset) throw new Error("Target TabSet doesn't exists");
    const donor = donorTabset.data.find((tab) => this.tabsEqual(tab, donorTab));
    if (donor === null) throw new Error("Original tab doesn't exists");
    if (donorTabsetKey !== targetTabsetKey) {
      const duplicate = targetTabset.data.find((tab) =>
        this.tabsEqual(tab, donor)
      );
      if (duplicate) throw new Error("TabSet already have this tab");
    }
    const target = targetTabset.data.find((tab) =>
      this.tabsEqual(tab, targetTab)
    );
    if (target === null) throw new Error("Target tab doesn't exists");
    const cut = donorTabset.data.splice(donorTabset.data.indexOf(donor), 1);
    targetTabset.data.splice(
      targetTabset.data.indexOf(target) + (after ? 1 : 0),
      0,
      cut[0]
    );
    await this.saveAll(d);
  }

  stringifyTab(tab) {
    return `${tab.url}||${tab.pinned}||${
      tab.cookieStoreId || DEFAULT_COOKIE_STORE_ID
    }`;
  }

  serializeTab(tab) {
    if (tab.cookieStoreId === PRIVATE_COOKIE_STORE_ID)
      tab.cookieStoreId = DEFAULT_COOKIE_STORE_ID;
    return {
      title: tab.title,
      url: getUnmangledURL(tab.url),
      favIconUrl: tab.favIconUrl,
      pinned: tab.pinned,
      cookieStoreId: tab.cookieStoreId || DEFAULT_COOKIE_STORE_ID,
    };
  }

  tabsEqual(a, b) {
    return this.stringifyTab(a) === this.stringifyTab(b);
  }

  findTabSet(tabsets, name) {
    return tabsets.find((x) => x.key === name);
  }

  getDefaultTabSetName() {
    const date = new Date();
    const pl = padLeft.bind(null, 2, "0");
    return `${date.getFullYear()}-${pl(date.getMonth() + 1)}-${pl(
      date.getDate()
    )} ${pl(date.getHours())}:${pl(date.getMinutes())}`;
  }

  tabSetsAreEqual(setA, setB) {
    setA = setA.filter((x) => !oneOf(x, "", "about:blank", "about:newtab"));
    setB = setB.filter((x) => !oneOf(x, "", "about:blank", "about:newtab"));
    return setsAreEqual(setA, setB);
  }
}
