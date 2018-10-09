import { bgpage, getCurrentTabs } from "./shared.js";
import { reverse, sleep, waitUntil } from "./utils.js";
import Vuex from "vuex/dist/vuex.esm.js";

export default async () => {
	const host = await bgpage();
	await waitUntil(() => host.loaded === true);

	const [items, settings, statesCount] = await Promise.all([
		host.TabSet.getAll(),
		host.settings.getAll(),
		host.Undo.count(),
	]);

	const store = new Vuex.Store({
		state: {
			items,
			settings,
			statesCount,
			notification: "",
			notificationCounter: 0,
		},
		getters: {
			itemsReversed(state) {
				return Array.from(reverse(state.items));
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
			async openUrl(context, [url, identity]) {
				await host.openURL(url, identity);
			},
			async updateStatesCount(context) {
				const count = await host.Undo.count();
				context.commit("updateStatesCount", count);
			},
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

	return store;
};
