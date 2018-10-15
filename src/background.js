import { readFileAsJson, saveFile } from "./utils.js";
import { openURL, storage, settings } from "./shared.js";
import { TabSet } from "./tabset.js";
import { History } from "./history.js";
import { diff as objdiff } from "deep-diff";

async function main() {
	browser.runtime.onMessage.addListener(async msg => {
		switch (msg) {
			case "import":
				const imported = await readFileAsJson();
				await TabSet.saveAll(imported);
				return;
			case "export":
				const out = JSON.stringify(await TabSet.getAll(), null, 2);
				try {
					await saveFile(out, "export.tabsaver.json");
				} catch (e) {}
				return;
		}
		if (typeof msg === "object" && "domain" in msg) {
			switch (msg.domain) {
				case "tabset":
					return await TabSet[msg.action](...msg.args);
				case "openURL":
					return await openURL(...msg.args);
			}
		}
	});

	window.storage = storage;
	window.settings = settings;
	window.TabSet = TabSet;
	window.Undo = History;

	window.trackHistory = true;

	let preChangeTabs = null;

	browser.storage.onChanged.addListener(async (diff, area) => {
		for (const [key, { oldValue, newValue }] of Object.entries(diff)) {
			if (key === "settings:useHistory" && newValue == false) {
				History.clear();
			} else if (key === "tabs" && window.trackHistory) {
				if (!(await settings.get("useHistory"))) return;
				preChangeTabs = preChangeTabs || oldValue;
				const tabsdiff = objdiff(newValue, preChangeTabs);
				History.push(tabsdiff, () => {
					preChangeTabs = null;
				});
			}
		}
	});
}

main().catch(err => console.error(err));
