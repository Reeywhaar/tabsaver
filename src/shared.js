import { setsAreEqual, oneOf, strAfter, padLeft, parseQuery } from "./utils.js";

export const DEFAULT_COOKIE_STORE_ID = "firefox-default";

const storageListeners = [];

export const storage = {
	async get(key, def = null) {
		const req = await browser.storage.local.get(key);
		if (!(key in req)) return def;
		return req[key];
	},
	async set(key, value) {
		await browser.storage.local.set({ [key]: value });
		let failedcbs = [];
		for (let cb of storageListeners) {
			try {
				cb(key, value);
			} catch (e) {
				if (e.message === "can't access dead object") {
					failedcbs.push(cb);
				}
			}
		}
		for (let fcb of failedcbs) {
			storageListeners.splice(storageListeners.indexOf(fcb), 1);
		}
	},
	subscribe(fn) {
		storageListeners.push(fn);
	},
};

export const pinned = {
	get() {
		return storage.get("includePinned", true);
	},
	set(val) {
		return storage.set("includePinned", val);
	},
};

export const bgpage = () => browser.runtime.getBackgroundPage();

export function isURLPrivileged(url) {
	if (url === "about:blank") return false;
	if (/^(chrome|javascript|data|file|about)\:/.test(url)) return true;
	return false;
}

export function getMangledURL(url) {
	if (isURLPrivileged(url))
		return `/html/handler.html?url=${encodeURIComponent(url)}`;
	return url;
}

export function getUnmangledURL(url) {
	if (url.indexOf(browser.extension.getURL("/html/handler.html")) === 0) {
		const qu = parseQuery("?" + strAfter(url, "handler.html?"));
		return qu.url;
	}
	return url;
}

export function tabSetsAreEqual(setA, setB) {
	setA = setA.filter(x => {
		return !oneOf(x, "", "about:blank", "about:newtab");
	});
	setB = setB.filter(x => {
		return !oneOf(x, "", "about:blank", "about:newtab");
	});
	return setsAreEqual(setA, setB);
}

export async function openURL(url, cookieStoreId = DEFAULT_COOKIE_STORE_ID) {
	return await browser.tabs.create({ url: getMangledURL(url), cookieStoreId });
}

export function getDefaultTabSetName() {
	const date = new Date();
	const pl = padLeft.bind(null, 2, "0");
	return `${date.getFullYear()}-${pl(date.getMonth() + 1)}-${pl(
		date.getDate()
	)} ${pl(date.getHours())}:${pl(date.getMinutes())}`;
}

export async function getCurrentTabs() {
	return (await browser.windows.getLastFocused({ populate: true })).tabs;
}
