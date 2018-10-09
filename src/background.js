import { readFileAsJson, saveFile } from "./utils.js";
import { openURL, storage, settings } from "./shared.js";
import { TabSet } from "./tabset.js";
import { History } from "./history.js";
import { diff } from "deep-diff";

async function main() {
	window.import = async () => {
		const imported = await readFileAsJson();
		await TabSet.saveAll(imported);
	};

	window.export = async () => {
		const out = JSON.stringify(await TabSet.getAll(), null, 2);
		try {
			await saveFile(out, "export.tabsaver.json");
		} catch (e) {}
	};

	window.storage = storage;
	window.settings = settings;
	window.TabSet = TabSet;
	window.Undo = History;

	window.openURL = openURL;

	window.trackHistory = true;
	window.preChangeTabs = null;

	storage.subscribeBefore(async (key, value) => {
		if (key === "tabs" && window.trackHistory) {
			if (!(await settings.get("useHistory"))) return;
			window.preChangeTabs =
				window.preChangeTabs || (await storage.get("tabs", []));
			const tabsdiff = diff(value, window.preChangeTabs);
			History.push(tabsdiff, () => {
				window.preChangeTabs = null;
			});
		}
	});

	storage.subscribe(async (key, value) => {
		if (key === "settings:useHistory" && value == false) {
			History.clear();
		}
	});

	window.loaded = true;
}

main().catch(err => console.error(err));
