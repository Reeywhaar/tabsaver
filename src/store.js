import { bgpage, getCurrentTabs } from "./shared.js";
import { reverse, sleep } from "./utils.js";
import Vuex from "vuex/dist/vuex.esm.js";

export default async () => {
	const api = await bgpage();
	const [items, pinned, settings] = await Promise.all([
		api.TabSet.getAll(),
		api.pinned.get(),
		api.settings.getAll(),
	]);

	const store = new Vuex.Store({
		state: {
			items,
			pinned,
			notification: "",
			notificationCounter: 0,
			settings,
		},
		getters: {
			itemsReversed(state) {
				return Array.from(reverse(state.items));
			},
		},
		mutations: {
			setPinned(state, value) {
				state.pinned = value;
			},
			setNotification(state, message) {
				state.notification = message;
			},
			setSetting(state, { key, value }) {
				state.settings[key] = value;
			},
			incrementNotificationCounter(state, amount) {
				state.notificationCounter += amount;
			},
			updateItems(state, items) {
				state.items = items;
			},
		},
		actions: {
			async import() {
				await api.import();
			},
			async export() {
				await api.export();
			},
			async notify(context, message) {
				context.commit("setNotification", message);
				context.commit("incrementNotificationCounter", 1);
				await sleep(3000);
				context.commit("incrementNotificationCounter", -1);
				if (context.state.notificationCounter === 0)
					context.commit("setNotification", "");
			},
			async setPinned(context, value) {
				await api.pinned.set(value);
				context.commit("setPinned", value);
			},
			async togglePinned(context) {
				await context.dispatch("setPinned", !context.state.pinned);
			},
			async updateItems(context) {
				context.commit("updateItems", await api.TabSet.getAll());
			},
			async setSetting(context, { key, value }) {
				await api.settings.set(key, value);
				context.commit("setSetting", { key, value });
			},
			async tabsetOpen(context, name = null) {
				return await api.TabSet.open(name);
			},
			async tabsetCreate(context, name = null) {
				await api.TabSet.add(name, await getCurrentTabs());
				context.dispatch("updateItems");
			},
			async tabsetSave(context, { name, color, tabs = null }) {
				tabs = tabs || (await getCurrentTabs());
				await api.TabSet.save(name, tabs, color);
				context.dispatch("updateItems");
			},
			async tabsetRename(context, [oldn, newn]) {
				await api.TabSet.rename(oldn, newn);
				context.dispatch("updateItems");
			},
			async tabsetRemove(context, name) {
				await api.TabSet.remove(name);
				context.dispatch("updateItems");
			},
			async tabsetMove(context, [tabsetName, targetName, after = true]) {
				await api.TabSet.moveTabSet(tabsetName, targetName, after);
				context.dispatch("updateItems");
			},
			async tabsetAppend(context, name) {
				if (Array.isArray(name)) {
					await api.TabSet.appendTab(...name);
				} else {
					await api.TabSet.appendTab(name);
				}
				context.dispatch("updateItems");
			},
			async tabsetRemoveTab(context, [tabsetName, tab]) {
				await api.TabSet.removeTab(tabsetName, tab);
				context.dispatch("updateItems");
			},
			async tabsetMoveTab(
				context,
				[tabsetName, tab, targetTabsetName, targetTab, after = true]
			) {
				await api.TabSet.moveTab(
					tabsetName,
					tab,
					targetTabsetName,
					targetTab,
					after
				);
				context.dispatch("updateItems");
			},
			async openUrl(context, [url, identity]) {
				await api.openURL(url, identity);
			},
		},
	});

	api.storage.subscribe((key, value) => {
		if (key === "tabs") {
			store.dispatch("updateItems");
		} else if (key === "includePinned") {
			store.commit("setPinned", value);
		} else if (key.indexOf("settings:") === 0) {
			key = key.substr(9);
			store.commit("setSetting", { key, value });
		}
	});

	return store;
};
