import "./globals.js";
import Vue from "vue/dist/vue.runtime.esm.js";
import Vuex from "vuex/dist/vuex.esm.js";
import getStore from "./store.js";
import WindowComponent from "./components/window.vue";

async function main() {
	const cwin = await browser.windows.getCurrent();
	if (cwin !== browser.windows.WINDOW_ID_NONE && cwin.incognito) {
		const host = document.querySelector(".main");
		const el = document.createElement("div");
		el.classList.add("incognito-mode-title");
		el.innerText = "Incognito Mode";
		host.appendChild(el);
		return;
	}

	Vue.config.devtools = false;
	Vue.use(Vuex);

	WindowComponent.store = await getStore();
	const app = new (Vue.extend(WindowComponent))();
	app.$mount(".main");
}

main().catch(err => console.error(err));
