import "./globals.js";
import { createApp, h } from "vue";
import getStore from "./store.js";
import OptionsView from "./components/options.vue";
import { createServices } from "./createServices.js";

async function main() {
  const app = createApp(OptionsView);
  const { settings, storage, tabset, history } = createServices();
  app.use(await getStore(storage, settings, tabset, history));
  app.mount(".main");
}

main().catch((err) => console.error(err));
