import "./globals.js";
import { createApp, h } from "vue";
import getStore from "./store";
import OptionsView from "./components/options";
import { createServices } from "./createServices";

async function main() {
  const app = createApp(OptionsView);
  const { settings, storage, tabset, history } = createServices();
  app.use(await getStore(storage, settings, tabset, history));
  app.mount(".main");
}

main().catch((err) => console.error(err));
