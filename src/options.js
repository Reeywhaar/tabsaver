import "./globals.js";
import { expand } from "./utils.js";
import Vue from "vue/dist/vue.runtime.esm.js";
import Vuex from "vuex/dist/vuex.esm.js";
import getStore from "./store.js";
import WindowComponent from "./components/options.vue";

async function main() {
	expand(document.querySelector(".main"), 20);
	Vue.config.devtools = false;
	Vue.use(Vuex);

	WindowComponent.store = await getStore();
	const appConstructor = Vue.extend(WindowComponent);
	const app = new appConstructor();
	app.$mount(".main");
}

main().catch(err => console.error(err));
