import "./globals.js";
import { createApp } from "vue";
import getStore from "./store.js";
import MainView from "./components/window.vue";
import { createServices } from "./createServices.js";

async function main() {
  const app = createApp(MainView);
  const { settings, storage, tabset, history } = createServices();
  app.use(await getStore(storage, settings, tabset, history));
  app.mount(".main");
}

main().catch((err) => console.error(err));
