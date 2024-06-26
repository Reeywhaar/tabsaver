import { isNotNil, oneOf, padLeft, setsAreEqual } from "../utils";
import {
  getMangledURL,
  getUnmangledURL,
  DEFAULT_COOKIE_STORE_ID,
  PRIVATE_COOKIE_STORE_ID,
} from "../shared";
import { TabDescriptor, TabSetDescriptor } from "../types";
import { Storage } from "./storage";

export class TabSet {
  storage!: Storage;

  async getAll() {
    return this.storage.get<TabSetDescriptor[]>("tabs", []);
  }

  async saveAll(tabs: TabSetDescriptor[]) {
    await this.storage.set("tabs", tabs);
  }

  async save(
    key: string,
    tabs: TabDescriptor[],
    color: string | null = null,
    size?: [number, number]
  ) {
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
      existing.color = color ?? undefined;
      existing.size = size;
    } else {
      d.push({
        key,
        data: tabsData,
        color: color ?? undefined,
        size,
      });
    }
    await this.saveAll(d);
  }

  async add(key: string, tabs: TabDescriptor[], size: [number, number]) {
    if (key === null || key === "") {
      key = this.getDefaultTabSetName();
    }
    const d = await this.getAll();
    if (d.find((x) => x.key === key)) throw new Error("Name exists");

    for (let set of d) {
      if (
        this.tabSetsAreEqual(
          set.data.map((x) => getUnmangledURL(x.url)).filter(isNotNil),
          tabs.map((x) => getUnmangledURL(x.url)).filter(isNotNil)
        )
      ) {
        throw new Error(`Set exists under name "${set.key}"`);
      }
    }
    return this.save(key, tabs, undefined, size);
  }

  async open(key: string) {
    const tabset = (await this.getAll()).find((x) => x.key === key);
    if (!tabset) throw new Error("Unknown TabSet");

    const windows = await browser.windows.getAll({ populate: true });
    for (let window of windows) {
      if (
        this.tabSetsAreEqual(
          tabset.data.map((x) => x.url).filter(isNotNil),
          (
            window.tabs?.map((x) => (x.url ? getUnmangledURL(x.url) : "")) ?? []
          ).filter(isNotNil)
        )
      ) {
        if (!window.id) continue;
        await browser.windows.update(window.id, { focused: true });
        return window.id;
      }
    }
    const allowedTabs = tabset.data.map((x) => {
      x.url = getMangledURL(x.url ?? "");
      return x;
    });
    if (allowedTabs.length === 0) {
      throw new Error("Trying to open empty TabSet");
    }
    const window = await browser.windows.create({
      width: tabset.size ? tabset.size[0] : undefined,
      height: tabset.size ? tabset.size[1] : undefined,
    });
    const tabNeedToBeClosed = window.tabs?.[0] ?? null;
    if (!tabNeedToBeClosed?.id) throw new Error("No tab to close");
    for (const [index, tab] of allowedTabs.entries()) {
      const props = {
        url: tab.url,
        windowId: window.id,
        pinned: tab["pinned"] ?? false,
        cookieStoreId: tab["cookieStoreId"] ?? DEFAULT_COOKIE_STORE_ID,
        active: false,
      };
      try {
        await browser.tabs.create(props);
      } catch (e: unknown) {
        if (!(e instanceof Error)) throw e;
        if (e.message.indexOf("No cookie store exists with ID") === 0) {
          props.url = `/dist/handler.html?url=${encodeURIComponent(
            tab.url ?? ""
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

  async rename(oldn: string, newn: string) {
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

  async remove(name: string) {
    const d = await this.getAll();
    const index = d.findIndex((x) => {
      return x.key === name;
    });
    if (index === -1) throw new Error("Unknown TabSet");

    d.splice(index, 1);
    await this.saveAll(d);
  }

  async moveTabSet(tabsetName: string, targetName: string, after = true) {
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

  async appendTab(tabsetName: string, passedTab = null, index = -1) {
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
    if (!tabset) throw new Error("TabSet doesn't exist");

    if (tabset.data.find((x) => this.tabsEqual(x, tabData)))
      throw new Error("Tab already exists");

    if (index === -1) {
      tabset.data.push(tabData);
    } else {
      tabset.data.splice(index, 0, tabData);
    }
    await this.saveAll(d);
  }

  async removeTab(tabsetName: string, tab: TabDescriptor) {
    const d = await this.getAll();
    const tabset = d.find((x) => x.key === tabsetName);
    if (!tabset) throw new Error("TabSet doesn't exist");
    const index = tabset.data.findIndex((x) => this.tabsEqual(x, tab));
    if (index === -1) {
      throw new Error("Tab doesn't exist");
    }
    tabset.data.splice(index, 1);
    await this.saveAll(d);
  }

  async moveTab(
    donorTabsetKey: string,
    donorTab: TabDescriptor,
    targetTabsetKey: string,
    targetTab: TabDescriptor,
    after = true
  ) {
    if (
      donorTabsetKey === targetTabsetKey &&
      this.tabsEqual(donorTab, targetTab)
    )
      return;
    const d = await this.getAll();
    const donorTabset = this.findTabSet(d, donorTabsetKey);
    if (!donorTabset) throw new Error("Original TabSet doesn't exists");
    const targetTabset =
      donorTabsetKey === targetTabsetKey
        ? donorTabset
        : this.findTabSet(d, targetTabsetKey);
    if (!targetTabset) throw new Error("Target TabSet doesn't exists");
    const donor = donorTabset.data.find((tab) => this.tabsEqual(tab, donorTab));
    if (!donor) throw new Error("Original tab doesn't exists");
    if (donorTabsetKey !== targetTabsetKey) {
      const duplicate = targetTabset.data.find((tab) =>
        this.tabsEqual(tab, donor)
      );
      if (duplicate) throw new Error("TabSet already have this tab");
    }
    const target = targetTabset.data.find((tab) =>
      this.tabsEqual(tab, targetTab)
    );
    if (!target) throw new Error("Target tab doesn't exists");
    const cut = donorTabset.data.splice(donorTabset.data.indexOf(donor), 1);
    targetTabset.data.splice(
      targetTabset.data.indexOf(target) + (after ? 1 : 0),
      0,
      cut[0]
    );
    await this.saveAll(d);
  }

  stringifyTab(tab: TabDescriptor) {
    return `${tab.url}||${tab.pinned}||${
      tab.cookieStoreId || DEFAULT_COOKIE_STORE_ID
    }`;
  }

  serializeTab(tab: TabDescriptor): TabDescriptor {
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

  tabsEqual(a: TabDescriptor, b: TabDescriptor) {
    return this.stringifyTab(a) === this.stringifyTab(b);
  }

  findTabSet(tabsets: TabSetDescriptor[], name: string) {
    return tabsets.find((x) => x.key === name);
  }

  getDefaultTabSetName() {
    const date = new Date();
    const pl = padLeft.bind(null, 2, "0");
    return `${date.getFullYear()}-${pl(String(date.getMonth() + 1))}-${pl(
      String(date.getDate())
    )} ${pl(String(date.getHours()))}:${pl(String(date.getMinutes()))}`;
  }

  tabSetsAreEqual(setA: string[], setB: string[]) {
    setA = setA.filter((x) => !oneOf(x, "", "about:blank", "about:newtab"));
    setB = setB.filter((x) => !oneOf(x, "", "about:blank", "about:newtab"));
    return setsAreEqual(setA, setB);
  }
}
