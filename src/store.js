import { storage as Storage, settings as Settings } from "./shared.js";
import { TabSet } from "./tabset.js";
import { History as Undo } from "./history.js";
import { reverse, sleep, debounce, first, parseQuery } from "./utils.js";
import Vuex from "vuex/dist/vuex.esm.js";

export default async () => {
	const windowid = await (async () => {
		const query = parseQuery(location.search);
		if ("windowid" in query) return parseInt(query.windowid, 10);
		return null;
	})();

	async function getWindowTabs() {
		const window = await (windowid === null
			? browser.windows.getCurrent({ populate: true })
			: browser.windows.get(windowid, { populate: true }));
		return window.tabs;
	}

	const [
		items,
		settings,
		statesCount,
		windows,
		currentTabs,
	] = await Promise.all([
		TabSet.getAll(),
		Settings.getAll(),
		Undo.count(),
		browser.windows.getAll({
			populate: true,
			windowTypes: ["normal"],
		}),
		browser.tabs.query({
			active: true,
		}),
	]);

	const store = new Vuex.Store({
		state: {
			windows,
			items,
			settings,
			statesCount,
			notification: "",
			notificationCounter: 0,
			currentTabs,
		},
		getters: {
			itemsReversed(state) {
				return Array.from(reverse(state.items));
			},
			currentWindow(state) {
				const focused = first(state.windows, x => x.focused);
				if (focused === null) {
					return first(state.windows, x => x.id === windowid);
				}
				return focused;
			},
			windows(state) {
				let url = browser.runtime.getURL("");
				url = url.substr(0, url.length - 1);
				return state.windows.filter(x => x.title.indexOf(url) !== 0);
			},
		},
		mutations: {
			updateItems(state, items) {
				state.items = items;
			},
			setSetting(state, { key, value }) {
				state.settings[key] = value;
			},
			setNotification(state, message) {
				state.notification = message;
			},
			incrementNotificationCounter(state, amount) {
				state.notificationCounter += amount;
			},
			updateStatesCount(state, count) {
				state.statesCount = count;
			},
			setCurrentTabs(state, tabs) {
				state.currentTabs = tabs;
			},
			setWindows(state, windows) {
				state.windows = windows;
			},
			removeWindowTab(state, tabId) {
				for (let window of state.windows) {
					for (let [index, tab] of window.tabs.entries()) {
						if (tab.id === tabId) {
							window.tabs.splice(index, 1);
							return;
						}
					}
				}
			},
		},
		actions: {
			async import(context, data) {
				await browser.runtime.sendMessage({
					type: "import",
					data,
				});
			},
			async export() {
				await browser.runtime.sendMessage("export");
			},
			async notify(context, message) {
				context.commit("setNotification", message);
				context.commit("incrementNotificationCounter", 1);
				await sleep(3000);
				context.commit("incrementNotificationCounter", -1);
				if (context.state.notificationCounter === 0)
					context.commit("setNotification", "");
			},
			async updateItems(context) {
				context.commit("updateItems", await TabSet.getAll());
			},
			async setSetting(context, { key, value }) {
				await Settings.set(key, value);
				context.commit("setSetting", { key, value });
			},
			async tabsetOpen(context, key = null) {
				return await browser.runtime.sendMessage({
					domain: "tabset",
					action: "open",
					args: [key],
				});
			},
			async tabsetCreate(context, key = null) {
				return await browser.runtime.sendMessage({
					domain: "tabset",
					action: "add",
					args: [key, await getWindowTabs()],
				});
			},
			async tabsetSave(context, { key, color, tabs = null }) {
				if (tabs === null) {
					tabs = await getWindowTabs();
					if (!context.state.settings.includePinned) {
						tabs = tabs.filter(x => !x.pinned);
					}
				}
				return await browser.runtime.sendMessage({
					domain: "tabset",
					action: "save",
					args: [key, tabs, color],
				});
			},
			async tabsetRename(context, [oldkey, newkey]) {
				return await browser.runtime.sendMessage({
					domain: "tabset",
					action: "rename",
					args: [oldkey, newkey],
				});
			},
			async tabsetRemove(context, key) {
				return await browser.runtime.sendMessage({
					domain: "tabset",
					action: "remove",
					args: [key],
				});
			},
			async tabsetMove(context, [tabsetKey, targetKey, after = true]) {
				await browser.runtime.sendMessage({
					domain: "tabset",
					action: "moveTabSet",
					args: [tabsetKey, targetKey, after],
				});
			},
			async tabsetAppend(context, key) {
				if (Array.isArray(key)) {
					await browser.runtime.sendMessage({
						domain: "tabset",
						action: "appendTab",
						args: [...key],
					});
				} else {
					await browser.runtime.sendMessage({
						domain: "tabset",
						action: "appendTab",
						args: [key],
					});
				}
			},
			async tabsetRemoveTab(context, [tabsetKey, tab]) {
				return await browser.runtime.sendMessage({
					domain: "tabset",
					action: "removeTab",
					args: [tabsetKey, tab],
				});
			},
			async tabsetMoveTab(
				context,
				[tabsetKey, tab, targetTabsetKey, targetTab, after = true]
			) {
				return await browser.runtime.sendMessage({
					domain: "tabset",
					action: "moveTab",
					args: [tabsetKey, tab, targetTabsetKey, targetTab, after],
				});
			},
			async clearTabsets(context) {
				await Storage.set("tabs", []);
			},
			async openUrl(context, [url, identity]) {
				return await browser.runtime.sendMessage({
					domain: "openURL",
					args: [url, identity],
				});
			},
			async updateStatesCount(context) {
				const count = await Undo.count();
				context.commit("updateStatesCount", count);
			},
			async undo(context) {
				await browser.runtime.sendMessage("undo");
			},
			updateWindows: debounce(async context => {
				context.commit(
					"setWindows",
					await browser.windows.getAll({
						populate: true,
						windowTypes: ["normal"],
					})
				);
			}, 200),
		},
	});

	browser.storage.onChanged.addListener((diff, area) => {
		for (const [key, { oldValue, newValue }] of Object.entries(diff)) {
			if (key === "tabs") {
				store.dispatch("updateItems");
			} else if (key.indexOf("settings:") === 0) {
				const ckey = key.substr(9);
				store.commit("setSetting", { key: ckey, value: newValue });
			} else if (key.indexOf("history:states") === 0) {
				store.dispatch("updateStatesCount");
			}
		}
	});

	browser.tabs.onUpdated.addListener(async () => {
		const tabs = await browser.tabs.query({
			active: true,
		});
		store.commit("setCurrentTabs", tabs);
		store.dispatch("updateWindows");
	});
	browser.tabs.onCreated.addListener(async () => {
		const tabs = await browser.tabs.query({
			active: true,
		});
		store.commit("setCurrentTabs", tabs);
		store.dispatch("updateWindows");
	});
	browser.tabs.onMoved.addListener(async () => {
		store.dispatch("updateWindows");
	});
	browser.tabs.onRemoved.addListener(async tabId => {
		store.commit("removeWindowTab", tabId);
	});
	browser.windows.onFocusChanged.addListener(async () => {
		store.dispatch("updateWindows");
	});
	browser.windows.onRemoved.addListener(async () => {
		store.dispatch("updateWindows");
	});
	browser.windows.onCreated.addListener(async () => {
		store.dispatch("updateWindows");
	});

	return store;
};
