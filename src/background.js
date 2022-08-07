import { saveFile } from "./utils.js";
import { openURL } from "./shared.js";
import { diff as objdiff, applyChange } from "deep-diff";
import { createServices } from "./createServices.js";

async function main() {
  let trackHistory = true;

  const { settings, storage, tabset, history } = createServices();

  browser.runtime.onMessage.addListener(async (msg) => {
    if (typeof msg === "object") {
      switch (msg.type) {
        case "import":
          await tabset.saveAll(msg.data);
          return;
      }
    }
    switch (msg) {
      case "export":
        const out = JSON.stringify(await tabset.getAll(), null, 2);
        try {
          await saveFile(out, "export.tabsaver.json");
        } catch (e) {}
        return;
      case "undo":
        try {
          trackHistory = false;
          let last = await history.pop();
          let target = await tabset.getAll();
          for (let change of last) {
            applyChange(target, target, change);
          }
          await storage.set("tabs", target);
        } finally {
          trackHistory = true;
        }
    }
    if (typeof msg === "object" && "domain" in msg) {
      switch (msg.domain) {
        case "tabset":
          return await tabset[msg.action](...msg.args);
        case "openURL":
          return await openURL(...msg.args);
      }
    }
  });

  window.storage = storage;
  window.settings = settings;
  window.TabSet = tabset;
  window.Undo = history;

  window.trackHistory = true;

  let preChangeTabs = null;

  browser.storage.onChanged.addListener(async (diff, area) => {
    for (const [key, { oldValue, newValue }] of Object.entries(diff)) {
      if (key === "settings:useHistory" && newValue == false) {
        history.clear();
      } else if (key === "tabs" && trackHistory) {
        if (!(await settings.get("useHistory"))) return;
        preChangeTabs = preChangeTabs || oldValue;
        const tabsdiff = objdiff(newValue, preChangeTabs);
        history.push(tabsdiff, () => {
          preChangeTabs = null;
        });
      }
    }
  });
}

main().catch((err) => console.error(err));
