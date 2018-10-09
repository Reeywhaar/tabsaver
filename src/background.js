import { readFileAsJson, saveFile } from "./utils.js";
import { openURL, storage, settings } from "./shared.js";
import { TabSet } from "./tabset.js";
import { History } from "./history.js";

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

	storage.subscribeBefore(async (key, value) => {
		if (key === "tabs") {
			if (!(await settings.get("useHistory"))) return;
			let tabs = await storage.get("tabs");
			History.push(tabs);
		}
	});

	storage.subscribe(async (key, value) => {
		if (key === "settings:useHistory" && value == false) {
			History.clear();
		}
	});
}

main().catch(err => console.error(err));
