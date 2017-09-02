import {
	readFileAsJson,
	saveFile,
} from "./utils.js";
import {
	data,
	load,
	openURL,
} from "./shared.js";
import {
	TabSet,
} from "./tabset.js";

async function main(){
	await load();
	window.data = data;

	window.import = async () => {
		const imported = await readFileAsJson();
		await data.set(imported);
	}

	window.export = async () => {
		const out = JSON.stringify(await data.get(), null, 2);
		try{
			await saveFile(out, "export.tabsaver.json");
		} catch (e) {};
	}

	window.TabSet = TabSet;
	window.openURL = openURL;
}

main().catch(err => console.error(err));
