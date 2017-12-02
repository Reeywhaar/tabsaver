import Vuex from "vuex";
import {bgpage, getCurrentTabs} from "./shared.js";
import {reverse, sleep} from "./utils.js";

export default async() => {
	const api = await bgpage();
	const [items, pinned] = await Promise.all([
		api.TabSet.getAll(),
		api.pinned.get(),
	]);

	return {
		state: {
			items,
			pinned,
			notification: "",
			notificationCounter: 0,
		},
		getters: {
			itemsReversed(state){
				return Array.from(reverse(state.items));
			}
		},
		mutations: {
			togglePinned(state){
				state.pinned = !state.pinned;
			},
			setNotification(state, message){
				state.notification = message;
			},
			incrementNotificationCounter(state, amount){
				state.notificationCounter += amount;
			},
			updateItems(state, items){
				state.items = items;
			},
		},
		actions: {
			async import(){
				await api.import();
			},
			async export(){
				await api.export();
			},
			async notify(context, message){
				context.commit("setNotification", message);
				context.commit("incrementNotificationCounter", 1);
				await sleep(3000);
				context.commit("incrementNotificationCounter", -1);
				if(context.state.notificationCounter === 0) context.commit("setNotification", "");
			},
			async togglePinned(context){
				await api.pinned.set(!context.state.pinned);
				context.commit("togglePinned");
			},
			async updateItems(context){
				context.commit("updateItems", await api.TabSet.getAll());
			},
			async tabsetOpen(context, name = null){
				return await api.TabSet.open(name);
			},
			async tabsetCreate(context, name = null){
				await api.TabSet.add(name, await getCurrentTabs());
				context.dispatch("updateItems");
			},
			async tabsetSave(context, name = null){
				await api.TabSet.save(name, await getCurrentTabs());
				context.dispatch("updateItems");
			},
			async tabsetRename(context, [oldn, newn]){
				await api.TabSet.rename(oldn, newn);
				context.dispatch("updateItems");
			},
			async tabsetRemove(context, name){
				await api.TabSet.remove(name);
				context.dispatch("updateItems");
			},
			async tabsetMove(context, [tabsetName, targetName, after = true]){
				await api.TabSet.moveTabSet(tabsetName, targetName, after);
				context.dispatch("updateItems");
			},
			async tabsetAppend(context, name){
				if(Array.isArray(name)){
					await api.TabSet.appendTab(...name);
				} else {
					await api.TabSet.appendTab(name);
				}
				context.dispatch("updateItems");
			},
			async tabsetRemoveTab(context, [tabsetName, tab]){
				await api.TabSet.removeTab(tabsetName, tab);
				context.dispatch("updateItems");
			},
			async tabsetMoveTab(context, [tabsetName, tab, targetTabsetName, targetTab, after = true]){
				await api.TabSet.moveTab(tabsetName, tab, targetTabsetName, targetTab, after);
				context.dispatch("updateItems");
			},
			async openUrl(context, [url, identity]){
				await api.openURL(url, identity);
			},
		},
	}
}