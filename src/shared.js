import { setsAreEqual, oneOf, strAfter, padLeft, parseQuery } from "./utils.js";

export const DEFAULT_COOKIE_STORE_ID = "firefox-default";

const storageListeners = [];
const storageBeforeListeners = [];

export const storage = {
	async get(key, def = null) {
		const req = await browser.storage.local.get(key);
		if (!(key in req)) return def;
		return req[key];
	},
	async set(key, value) {
		{
			let failedcbs = [];
			for (let cb of storageBeforeListeners) {
				try {
					await cb(key, value);
				} catch (e) {
					if (e.message === "can't access dead object") {
						failedcbs.push(cb);
					} else {
						throw e;
					}
				}
			}
			for (let fcb of failedcbs) {
				storageBeforeListeners.splice(storageBeforeListeners.indexOf(fcb), 1);
			}
		}
		await browser.storage.local.set({ [key]: value });
		{
			let failedcbs = [];
			for (let cb of storageListeners) {
				try {
					cb(key, value);
				} catch (e) {
					if (e.message === "can't access dead object") {
						failedcbs.push(cb);
					} else {
						throw e;
					}
				}
			}
			for (let fcb of failedcbs) {
				storageListeners.splice(storageListeners.indexOf(fcb), 1);
			}
		}
	},
	subscribeBefore(fn) {
		storageBeforeListeners.push(fn);
	},
	subscribe(fn) {
		storageListeners.push(fn);
	},
};

const settingsDefault = {
	includePinned: true,
	showFavicons: false,
	showTitles: false,
	showCount: false,
	useHistory: true,
	numberOfHistoryStates: 15,
	theme: "light",
	overlayPosition: "right",
};
const settingsKeys = Object.keys(settingsDefault);
const settingsListeners = [];

export const settings = {
	get(key) {
		if (settingsKeys.indexOf(key) === -1)
			throw new Error(`Unknown Preferences key: ${key}`);
		return storage.get(`settings:${key}`, settingsDefault[key]);
	},
	async getAll() {
		let keys = Object.keys(settingsDefault);
		let rsettings = (await Promise.all(
			keys.map(x => settings.get(x).then(setting => [x, setting]))
		)).reduce((c, [key, value]) => {
			if (value !== null) {
				c[key] = value;
			}
			return c;
		}, {});
		return Object.assign({}, settingsDefault, rsettings);
	},
	async set(key, val) {
		await storage.set(`settings:${key}`, val);
		{
			let failedcbs = [];
			for (let cb of settingsListeners) {
				try {
					await cb(key, value);
				} catch (e) {
					if (e.message === "can't access dead object") {
						failedcbs.push(cb);
					} else {
						throw e;
					}
				}
			}
			for (let fcb of failedcbs) {
				settingsListeners.splice(settingsListeners.indexOf(fcb), 1);
			}
		}
	},
	subscribe(fn) {
		settingsListeners.push(fn);
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
		return `/dist/handler.html?url=${encodeURIComponent(url)}`;
	return url;
}

export function getUnmangledURL(url) {
	if (url.indexOf(browser.extension.getURL("/dist/handler.html")) === 0) {
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
	try {
		return await browser.tabs.create({
			url: getMangledURL(url),
			cookieStoreId,
		});
	} catch (e) {
		if (e.message.substr(0, 27) === "No cookie store exists with") {
			return await browser.tabs.create({
				url: getMangledURL(url),
				cookieStoreId: DEFAULT_COOKIE_STORE_ID,
			});
		} else {
			throw e;
		}
	}
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
