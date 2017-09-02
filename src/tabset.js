import {
	first,
	firstIndex,
	oneOf,
	getKey,
} from "./utils.js";
import {
	getMangledURL,
	getUnmangledURL,
	getDefaultTabSetName,
	DEFAULT_COOKIE_STORE_ID,
	tabSetsAreEqual,
	load,
} from "./shared.js";

export const TabSet = {
	async save(name, tabs){
		const tabsData = tabs
		.map(x => ({
			url: x.url,
			pinned: x.pinned,
			cookieStoreId: x.cookieStoreId || DEFAULT_COOKIE_STORE_ID,
		}))
		.filter(x => {
			return !oneOf(x.url, "about:blank", "about:newtab");
		})
		.map(x => {
			x.url = getUnmangledURL(x.url);
			return x;
		});
		if(tabsData.length === 0){
			throw new Error("TabSet is empty");
		};
		const d = await data.get();
		const index = firstIndex(d, x => {
			return x.key === name;
		});
		if (index > -1){
			d[index].data = tabsData;
		} else {
			d.push({
				key: name,
				data: tabsData,
			});
		}
		await data.set(d);
		return await data.get();
	},
	async add(name, tabs){
		if(name === null){
			name = getDefaultTabSetName();
		};
		const d = await data.get();
		if (first(d, x => {
			return x.key === name;
		}) !== null){
			throw new Error("Name exists");
		};
		for(let set of d){
			if(tabSetsAreEqual(
				set.data.map(x => getUnmangledURL(x.url)),
				tabs.map(x => getUnmangledURL(x.url))
			)){
				throw new Error(`Set exists under name "${set.key}"`);
			}
		};
		return await this.save(name, tabs);
	},
	async open(name){
		const tabset = first(await data.get(), x => x.key === name);
		if(tabset === null){
			throw new Error("Unknown TabSet");
		}
		const windows = await browser.windows.getAll({populate:true});
		for(let window of windows){
			if(tabSetsAreEqual(
				tabset.data.map(x => x.url),
				window.tabs.map(x => getUnmangledURL(x.url))
			)){
				await browser.windows.update(window.id, {focused:true})
				return window.id;
			};
		};
		const allowedTabs = tabset.data.map(x => {
			x.url = getMangledURL(x.url);
			return x;
		});
		const window = await browser.windows.create();
		const tabNeedToBeClosed = window.tabs[0];
		for(const [index, tab] of allowedTabs.entries()){
			const props = {
				url: tab.url,
				windowId: window.id,
				pinned: getKey(tab, "pinned", false),
				cookieStoreId: getKey(tab, "cookieStoreId", DEFAULT_COOKIE_STORE_ID),
				active: false,
			};
			try{
				await browser.tabs.create(props);
			} catch (e) {
				if(e.message.indexOf("No cookie store exists with ID") === 0){
					props.url =	`/html/handler.html?url=${encodeURIComponent(tab.url)}&containerRemoved=true`;
					props.cookieStoreId = DEFAULT_COOKIE_STORE_ID;
					await browser.tabs.create(props);
				} else {
					throw e;
				}
			}
			if(index === 0) await browser.tabs.remove(tabNeedToBeClosed.id);
		}
		return window.id;
	},
	async rename(oldn, newn){
		const d = await data.get();

		const newExists = firstIndex(d, x => {
			return x.key === newn;
		}) > -1;
		if(newExists) throw new Error("Name already exists");

		const index = firstIndex(d, x => {
			return x.key === oldn;
		});
		if(index === -1) throw new Error("Unknown TabSet");

		d[index].key = newn;
		await data.set(d);
		return await data.get();
	},
	async remove(name){
		const d = await data.get();
		const index = firstIndex(d, x => {
			return x.key === name;
		});
		if(index === -1) throw new Error("Unknown TabSet");

		d.splice(index, 1);
		await data.set(d);
		return await data.get();
	},
}

async function load(){
	await load();
}