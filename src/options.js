import "./globals.js";
import Vue from "vue/dist/vue.runtime.esm.js";
import Vuex from "vuex/dist/vuex.esm.js";
import getStore from "./store.js";
import WindowComponent from "./components/options.vue";

async function main() {
  Vue.config.devtools = false;
  Vue.use(Vuex);

  WindowComponent.store = await getStore();
  const app = new (Vue.extend(WindowComponent))();
  app.$mount(".main");
}

main().catch((err) => console.error(err));
