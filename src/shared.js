import {
	pipe,
	setsAreEqual,
	oneOf,
	strAfter,
	padLeft,
	parseQuery,
	withDefault,
} from "./utils.js";

export const DEFAULT_COOKIE_STORE_ID = "firefox-default";

const storage = {
	async get(key, def = null){
		const req = await browser.storage.local.get(key);
		if(!(key in req)) return def;
		return req[key];
	},
	async set(key, value){
		await browser.storage.local.set({[key]: value});
	},
}

export const data = {
	async set(data){
		await storage.set("tabs", data);
	},
	async get(){
		return storage.get("tabs", []);
	},
	getPinned(){
		return storage.get("includePinned", true);
	},
	setPinned(val){
		return storage.set("includePinned", val);
	},
}

//will be set in load
let extensionURL;

export function isURLPrivileged(url){
	if(url === "about:blank") return false;
	if(/^(chrome|javascript|data|file|about)\:/.test(url)) return true;
	return false;
}

export function getMangledURL(url){
	if(isURLPrivileged(url)) return `/html/handler.html?url=${encodeURIComponent(url)}`;
	return url;
}

export function getUnmangledURL(url){
	if(url.indexOf(extensionURL) === 0){
		const qu = parseQuery("?" + strAfter(url, "handler.html?"));
		return qu.url;
	};
	return url;
}

export function tabSetsAreEqual(setA, setB){
	setA = setA.filter(x => {
		return !oneOf(x, "", "about:blank", "about:newtab");
	})
	setB = setB.filter(x => {
		return !oneOf(x, "", "about:blank", "about:newtab");
	})
	return setsAreEqual(setA, setB);
}

export async function openURL(url, cookieStoreId = DEFAULT_COOKIE_STORE_ID){
	return await browser.tabs.create({url: getMangledURL(url), cookieStoreId});
}

export function getDefaultTabSetName(){
	const date = new Date();
	const pl = padLeft.bind(null, 2, "0");
	return `${date.getFullYear()}-${pl(date.getMonth()+1)}-${pl(date.getDate())} ${pl(date.getHours())}:${pl(date.getMinutes())}`;
}

export async function load(){
	extensionURL = browser.extension.getURL("/html/handler.html");
}
