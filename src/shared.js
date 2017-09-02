import {pipe, withDefault} from "./utils.js";

export const data = {
	async set(data){
		await browser.storage.local.set({
			"tabs": data,
		});
	},
	async get(){
		return await pipe(
			browser.storage.local.get("tabs").then(x => x.tabs ? x.tabs : null),
			x => withDefault(x, []),
		);
	},
}

export const DEFAULT_COOKIE_STORE_ID = "firefox-default";