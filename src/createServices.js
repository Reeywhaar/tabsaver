import { History } from "./services/history";
import { Settings } from "./services/settings";
import { Storage } from "./services/storage";
import { TabSet } from "./services/tabset";

export function createServices() {
  const storage = new Storage();

  const settings = new Settings();
  settings.storage = storage;

  const tabset = new TabSet();
  tabset.storage = storage;

  const history = new History();
  history.storage = storage;
  history.settings = settings;

  return {
    storage,
    settings,
    tabset,
    history,
  };
}
