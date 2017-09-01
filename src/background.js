import {
	readFileAsJson,
	saveFile,
	first,
	setsAreEqual,
	firstIndex,
	oneOf,
	sleep,
	strAfter,
	getKey
} from "./utils.js";
import {data} from "./shared.js";

const DEFAULT_COOKIE_STORE_ID = "firefox-default";

async function main(){
	const extensionURL = await browser.extension.getURL("/html/handler.html");

	function isURLPrivileged(url){
		if(url === "about:blank") return false;
		if(/^(chrome|javascript|data|file|about)\:/.test(url)) return true;
		return false;
	}

	function getMangledURL(url){
		if(isURLPrivileged(url)) return `/html/handler.html?url=${encodeURIComponent(url)}`;
		return url;
	}

	function getUnmangledURL(url){
		if(url.indexOf(extensionURL) === 0) return decodeURIComponent(strAfter(url, "?url="));
		return url;
	}

	function tabSetsAreEqual(setA, setB){
		setA = setA.filter(x => {
			return !oneOf(x, "", "about:blank", "about:newtab");
		})
		setB = setB.filter(x => {
			return !oneOf(x, "", "about:blank", "about:newtab");
		})
		return setsAreEqual(setA, setB);
	}

	window.import = async () => {
		const imported = await readFileAsJson();
		await data.set(imported);
	}

	window.export = async () => {
		const out = JSON.stringify(await data.get(), null, 2);
		try{
			await saveFile(out, "export.tabsaver.json");
		} catch (e) {};
	}

	window.saveTabSet = async (name, tabs) => {
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
	}

	window.addTabSet = async (name, tabs) => {
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
		return await window.saveTabSet(name, tabs);
	};

	window.openTabSet = async (name) => {
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
				return;
			};
		};
		const allowedTabs = tabset.data.map(x => {
			x.url = getMangledURL(x.url);
			return x;
		});
		let window = await browser.windows.create();
		const tabNeedToBeClosed = window.tabs[0];
		for(const [index, tab] of allowedTabs.entries()){
			await browser.tabs.create({
				url: tab.url,
				windowId: window.id,
				pinned: getKey(tab, "pinned", false),
				cookieStoreId: getKey(tab, "cookieStoreId", DEFAULT_COOKIE_STORE_ID),
				active: false,
			});
			if(index === 0) await browser.tabs.remove(tabNeedToBeClosed.id);
		}
	};

	window.renameTabSet = async (oldn, newn) => {
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
	}

	window.removeTabSet = async (name) => {
		const d = await data.get();
		const index = firstIndex(d, x => {
			return x.key === name;
		});
		if(index === -1) throw new Error("Unknown TabSet");

		d.splice(index, 1);
		await data.set(d);
		return await data.get();
	}
}

main().catch(err => console.error(err));
