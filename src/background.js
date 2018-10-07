import { readFileAsJson, saveFile } from "./utils.js";
import { pinned, openURL } from "./shared.js";
import { TabSet } from "./tabset.js";

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

	window.pinned = pinned;

	window.TabSet = TabSet;
	window.openURL = openURL;
}

main().catch(err => console.error(err));
