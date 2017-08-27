import {withDefault, pipe, readFile, setsAreEqual, live, first, firstIndex, sleep, oneOf} from "./utils.js";
import {data} from "./shared.js";

const templates = {
	"tab-saver-item": `
		<div class="tab-saver-item" data-name="{saveName}">
			<span class="tab-saver-item__title">{saveName}</span>
			<span class="tab-saver-item-button btn-open">Open</span>
			<span class="tab-saver-item-button btn-save">Save</span>
			<span class="tab-saver-item-button btn-remove">✖︎</span>
		</div>
	`,
	"tab-saver-items": `<div class="tab-saver-items">{content}</div>`,
};

const DOM = {
	content: document.querySelector(".content"),
	new: {
		input: document.querySelector(".input__save-new"),
		button: document.querySelector(".button__save-new"),
	},
	import: document.querySelector(".prefs__import"),
	export: document.querySelector(".prefs__export"),
};

function parseTemplate(tpl, data = {}){
	for(let val in data){
		tpl = tpl.split(`{${val}}`).join(data[val]);
	};
	return tpl;
}

function render(data){
	const itemsHTML = data.map(({key, data}) => {
		return parseTemplate(templates["tab-saver-item"], {
			saveName: key,
		});
	}).join("\n");
	return parseTemplate(templates["tab-saver-items"], {
		content: itemsHTML,
	});
}

function attachListeners(callback){
	DOM.new.button.addEventListener("click", async () => {
		if (DOM["new"].input.value !== "") {
			await callback("new", DOM["new"].input.value)
			DOM["new"].input.value = "";
		}
	});
	DOM.new.input.addEventListener("keydown", e => {
		if (e.which === 13) DOM.new.button.click();
	});
	["save", "open", "remove"].forEach(event => {
		live(DOM.content, ".tab-saver-item .btn-" + event, "click", async function() {
			let parent = this.parentElement;
			await callback("item:" + event, parent.dataset.name);
		});
	});
	live(DOM.content, ".tab-saver-item__title", "dblclick", async function() {
		this.contentEditable = true;
		this.focus();
		document.execCommand("selectAll", false, null);
	});
	live(
		DOM.content,
		".tab-saver-item__title[contenteditable=true]",
		"keydown",
		async function(e) {
			if (e.which === 13) {
				e.preventDefault();
				const oldv = this.parentElement.dataset.name;
				const newv = this.textContent;
				if (oldv !== newv && newv.length > 0) {
					await callback("item:rename", [oldv, newv])
				} else {
					this.textContent = oldv;
				}
				this.contentEditable = false;
			}
		}
	);
	DOM.import.addEventListener("click", async e => {
		await callback("import settings");
	});
	DOM.export.addEventListener("click", async e => {
		await callback("export settings");
	});
}

async function getCurrentTabs(){
	return (await browser.windows.getLastFocused({populate: true})).tabs;
}

let notificationCounter = 0;

function notify(text){
	document.querySelector(".notification").innerHTML = text;
	notificationCounter++;
	sleep(6000).then(() => {
		notificationCounter--;
		if(notificationCounter === 0){
			document.querySelector(".notification").innerHTML = "";
		}
	})
}

async function main(){
	DOM.content.innerHTML = render((await data.get()).reverse());
	const bgpage = await browser.runtime.getBackgroundPage();

	attachListeners(async (event, payload = null)=>{
		const handlers = {
			"new": async (name) => {
				try{
					const d = await bgpage.addTabSet(name, await getCurrentTabs());
					document.querySelector(".content").innerHTML = render(d.reverse());
				} catch (e) {
					if(oneOf(e.message, "Name exists", "TabSet is empty")){
						notify(e.message);
					}
					else if(e.message.indexOf("Set exists under name") === 0){
						notify(e.message);
					}
					else {
						notify("Some error occured");
						console.error(e);
					}
				}
			},
			"item:open": async (name) => {
				await bgpage.openTabSet(name);
			},
			"item:save": async (name) => {
				try{
					const d = await bgpage.saveTabSet(name, await getCurrentTabs());
					notify(`"${name}" saved`);
					document.querySelector(".content").innerHTML = render(d.reverse());
				} catch (e) {
					if(e.message === "Unknown TabSet"){
						notify(e.message);
					} else {
						notify("Some error occured");
						console.error(e);
					}
				}
			},
			"item:remove": async (name) => {
				try{
					const d = await bgpage.removeTabSet(name);
					notify(`"${name}" removed`);
					document.querySelector(".content").innerHTML = render(d.reverse());
				} catch (e) {
					if(e.message === "Unknown TabSet"){
						notify(e.message);
					} else {
						notify("Some error occured");
						console.error(e);
					}
				}
			},
			"item:rename": async ([oldn, newn]) => {
				try{
					const d = await bgpage.renameTabSet(oldn, newn);
					document.querySelector(".content").innerHTML = render(d.reverse());
				} catch (e) {
					if(e.message === "Name already exists"){
						notify(e.message);
						throw e;
					}
					else if(e.message === "Unknown TabSet"){
						notify(e.message);
					} else {
						notify("Some error occured");
						console.error(e);
					}
				}
			},
			"export settings": async () => {
				bgpage.export();
			},
			"import settings": async () => {
				bgpage.import();
			},
		};
		if(handlers[event]){
			return await handlers[event](payload);
		};
	});
}

main().catch(err => console.error(err));