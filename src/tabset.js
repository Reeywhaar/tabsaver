import { first, firstIndex, oneOf, getKey } from "./utils.js";
import {
	storage,
	pinned,
	getMangledURL,
	getUnmangledURL,
	getDefaultTabSetName,
	tabSetsAreEqual,
	DEFAULT_COOKIE_STORE_ID,
} from "./shared.js";

const stringifyTab = tab => {
	return `${tab.url}||${tab.pinned}||${tab.cookieStoreId ||
		DEFAULT_COOKIE_STORE_ID}`;
};

const tabsEqual = (a, b) => {
	return stringifyTab(a) === stringifyTab(b);
};

const findTabSet = (tabsets, name) => {
	return first(tabsets, x => x.key === name);
};

const listeners = [];

export const TabSet = {
	subscribe(fn) {
		listeners.push(fn);
	},
	async getAll() {
		return storage.get("tabs", []);
	},
	async saveAll(tabs) {
		await storage.set("tabs", tabs);
		let failedcbs = [];
		for (let cb of listeners) {
			try {
				cb(tabs);
			} catch (e) {
				if (e.message === "can't access dead object") {
					failedcbs.push(cb);
				}
			}
		}
		for (let fcb of failedcbs) {
			listeners.splice(listeners.indexOf(fcb), 1);
		}
	},
	async save(name, tabs) {
		const includePinned = await pinned.get();
		const tabsData = tabs
			.map(x => ({
				title: x.title,
				url: x.url,
				pinned: x.pinned,
				cookieStoreId: x.cookieStoreId || DEFAULT_COOKIE_STORE_ID,
			}))
			.filter(x => {
				if (!includePinned && x.pinned) return false;
				return !oneOf(x.url, "about:blank", "about:newtab");
			})
			.map(x => {
				x.url = getUnmangledURL(x.url);
				return x;
			});
		if (tabsData.length === 0) {
			throw new Error("TabSet is empty");
		}
		const d = await TabSet.getAll();
		const index = firstIndex(d, x => {
			return x.key === name;
		});
		if (index > -1) {
			d[index].data = tabsData;
		} else {
			d.push({
				key: name,
				data: tabsData,
			});
		}
		await TabSet.saveAll(d);
	},
	async add(name, tabs) {
		if (name === null || name === "") {
			name = getDefaultTabSetName();
		}
		const d = await TabSet.getAll();
		if (
			first(d, x => {
				return x.key === name;
			}) !== null
		) {
			throw new Error("Name exists");
		}
		for (let set of d) {
			if (
				tabSetsAreEqual(
					set.data.map(x => getUnmangledURL(x.url)),
					tabs.map(x => getUnmangledURL(x.url))
				)
			) {
				throw new Error(`Set exists under name "${set.key}"`);
			}
		}
		return await this.save(name, tabs);
	},
	async open(name) {
		const tabset = first(await TabSet.getAll(), x => x.key === name);
		if (tabset === null) {
			throw new Error("Unknown TabSet");
		}
		const windows = await browser.windows.getAll({ populate: true });
		for (let window of windows) {
			if (
				tabSetsAreEqual(
					tabset.data.map(x => x.url),
					window.tabs.map(x => getUnmangledURL(x.url))
				)
			) {
				await browser.windows.update(window.id, { focused: true });
				return window.id;
			}
		}
		const allowedTabs = tabset.data.map(x => {
			x.url = getMangledURL(x.url);
			return x;
		});
		if (allowedTabs.length === 0) {
			throw new Error("Trying to open empty TabSet");
		}
		const window = await browser.windows.create();
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
					props.url = `/html/handler.html?url=${encodeURIComponent(
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
	},
	async rename(oldn, newn) {
		const d = await TabSet.getAll();

		const newExists =
			firstIndex(d, x => {
				return x.key === newn;
			}) > -1;
		if (newExists) throw new Error("Name already exists");

		const index = firstIndex(d, x => {
			return x.key === oldn;
		});
		if (index === -1) throw new Error("Unknown TabSet");

		d[index].key = newn;
		await TabSet.saveAll(d);
	},
	async remove(name) {
		const d = await TabSet.getAll();
		const index = firstIndex(d, x => {
			return x.key === name;
		});
		if (index === -1) throw new Error("Unknown TabSet");

		d.splice(index, 1);
		await TabSet.saveAll(d);
	},
	async moveTabSet(tabsetName, targetName, after = true) {
		if (tabsetName === targetName) return;
		const d = await TabSet.getAll();
		const a = findTabSet(d, tabsetName);
		if (!a) throw new Error("Original doesn't exists");
		const b = findTabSet(d, targetName);
		if (!b) throw new Error("Target doesn't exists");
		const cut = d.splice(d.indexOf(a), 1);
		d.splice(d.indexOf(b) + (after ? 0 : 1), 0, cut[0]);
		await TabSet.saveAll(d);
	},
	async appendTab(tabsetName, passedTab = null) {
		const tab = passedTab || (await browser.tabs.query({ active: true }))[0];
		if (tab.id === browser.tabs.TAB_ID_NONE) {
			throw new Error("Invalid tab");
		}
		if (oneOf(tab.url, "about:blank", "about:newtab")) {
			throw new Error("Trying to add blank page");
		}
		const tabData = {
			title: tab.title,
			url: tab.url,
			pinned: tab.pinned,
			cookieStoreId: tab.cookieStoreId,
		};

		const d = await TabSet.getAll();
		const tabset = first(d, x => x.key === tabsetName);
		if (!tabset) {
			throw new Error("TabSet doesn't exist");
		}
		if (first(tabset.data, x => tabsEqual(x, tabData))) {
			throw new Error("Tab already exists");
		}
		tabset.data.push(tabData);
		await TabSet.saveAll(d);
	},
	async removeTab(tabsetName, tab) {
		const d = await TabSet.getAll();
		const tabset = first(d, x => x.key === tabsetName);
		const index = firstIndex(tabset.data, x => tabsEqual(x, tab));
		if (index === -1) {
			throw new Error("Tab doesn't exist");
		}
		tabset.data.splice(index, 1);
		await TabSet.saveAll(d);
	},
	async moveTab(
		donorTabsetKey,
		donorTab,
		targetTabsetKey,
		targetTab,
		after = true
	) {
		if (donorTabsetKey === targetTabsetKey && tabsEqual(donorTab, targetTab))
			return;
		const d = await TabSet.getAll();
		const donorTabset = findTabSet(d, donorTabsetKey);
		if (!donorTabset) throw new Error("Original TabSet doesn't exists");
		const targetTabset =
			donorTabsetKey === targetTabsetKey
				? donorTabset
				: findTabSet(d, targetTabsetKey);
		if (!targetTabset) throw new Error("Target TabSet doesn't exists");
		const donor = first(donorTabset.data, tab => tabsEqual(tab, donorTab));
		if (!donor) throw new Error("Original tab doesn't exists");
		if (donorTabsetKey !== targetTabsetKey) {
			const duplicate = first(targetTabset.data, tab => tabsEqual(tab, donor));
			if (duplicate) throw new Error("TabSet already have this tab");
		}
		const target = first(targetTabset.data, tab => tabsEqual(tab, targetTab));
		if (!target) throw new Error("Target tab doesn't exists");
		const cut = donorTabset.data.splice(donorTabset.data.indexOf(donor), 1);
		targetTabset.data.splice(
			targetTabset.data.indexOf(target) + (after ? 1 : 0),
			0,
			cut[0]
		);
		await TabSet.saveAll(d);
	},
};
