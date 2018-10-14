import { bgpage, getCurrentTabs } from "./shared.js";
import {
	reverse,
	sleep,
	waitUntil,
	debounce,
	first,
	parseQuery,
} from "./utils.js";
import Vuex from "vuex/dist/vuex.esm.js";
import { applyChange } from "deep-diff";

export default async () => {
	const host = await bgpage();
	await waitUntil(() => host.loaded === true);

	const windowid = (() => {
		const query = parseQuery(location.search);
		if ("windowid" in query) {
			return parseInt(query.windowid, 10);
		}
		return null;
	})();

	const [
		items,
		settings,
		statesCount,
		windows,
		currentWindow,
	] = await Promise.all([
		host.TabSet.getAll(),
		host.settings.getAll(),
		host.Undo.count(),
		browser.windows.getAll({
			populate: true,
		}),
		browser.windows.getCurrent(),
	]);

	const currentTabs = await browser.tabs.query({
		active: true,
	});

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
				if (focused === null) return null;
				if (windowid !== null && focused.id === currentWindow.id)
					return first(state.windows, x => x.id === windowid);
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
			async import() {
				await host.import();
			},
			async export() {
				await host.export();
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
				context.commit("updateItems", await host.TabSet.getAll());
			},
			async setSetting(context, { key, value }) {
				await host.settings.set(key, value);
				context.commit("setSetting", { key, value });
			},
			async tabsetOpen(context, key = null) {
				return await host.TabSet.open(key);
			},
			async tabsetCreate(context, key = null) {
				await host.TabSet.add(key, await getCurrentTabs());
			},
			async tabsetSave(context, { key, color, tabs = null }) {
				if (tabs === null) {
					tabs = await getCurrentTabs();
					if (!context.state.settings.includePinned) {
						tabs = tabs.filter(x => !x.pinned);
					}
				}
				await host.TabSet.save(key, tabs, color);
			},
			async tabsetRename(context, [oldkey, newkey]) {
				await host.TabSet.rename(oldkey, newkey);
			},
			async tabsetRemove(context, key) {
				await host.TabSet.remove(key);
			},
			async tabsetMove(context, [tabsetKey, targetKey, after = true]) {
				await host.TabSet.moveTabSet(tabsetKey, targetKey, after);
			},
			async tabsetAppend(context, key) {
				if (Array.isArray(key)) {
					await host.TabSet.appendTab(...key);
				} else {
					await host.TabSet.appendTab(key);
				}
			},
			async tabsetRemoveTab(context, [tabsetKey, tab]) {
				await host.TabSet.removeTab(tabsetKey, tab);
			},
			async tabsetMoveTab(
				context,
				[tabsetKey, tab, targetTabsetKey, targetTab, after = true]
			) {
				await host.TabSet.moveTab(
					tabsetKey,
					tab,
					targetTabsetKey,
					targetTab,
					after
				);
			},
			async clearTabsets(context) {
				await host.storage.set("tabs", []);
			},
			async openUrl(context, [url, identity]) {
				await host.openURL(url, identity);
			},
			async updateStatesCount(context) {
				const count = await host.Undo.count();
				context.commit("updateStatesCount", count);
			},
			async undo(context) {
				try {
					host.trackHistory = false;
					let last = await host.Undo.pop();
					let target = JSON.parse(JSON.stringify(context.state.items));
					for (let change of last) {
						applyChange(target, target, change);
					}
					await host.storage.set("tabs", target);
				} finally {
					host.trackHistory = true;
				}
			},
			updateWindows: debounce(async context => {
				context.commit(
					"setWindows",
					await browser.windows.getAll({
						populate: true,
					})
				);
			}, 200),
		},
	});

	host.storage.subscribe((key, value) => {
		if (key === "tabs") {
			store.dispatch("updateItems");
		} else if (key === "includePinned") {
			store.commit("setPinned", value);
		} else if (key.indexOf("settings:") === 0) {
			key = key.substr(9);
			store.commit("setSetting", { key, value });
		} else if (key.indexOf("history:states") === 0) {
			store.dispatch("updateStatesCount");
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

	return store;
};
