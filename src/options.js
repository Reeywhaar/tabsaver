import "./globals.js";
import { createApp } from "vue";
import getStore from "./store.js";
import WindowComponent from "./components/options.vue";

async function main() {
  const app = createApp(WindowComponent);
  app.use(await getStore());
  app.mount(".main");
}

main().catch((err) => console.error(err));
