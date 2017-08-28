import {live, sleep, oneOf} from "./utils.js";
import {data} from "./shared.js";

const DOM = {
	content: document.querySelector(".content"),
	new: {
		input: document.querySelector(".input__save-new"),
		button: document.querySelector(".button__save-new"),
	},
	import: document.querySelector(".prefs__import"),
	export: document.querySelector(".prefs__export"),
};

function render(data){
	const items = document.querySelector("#tab-saver-items").content;
	const item = document.querySelector("#tab-saver-item").content;
	const itemsDOM = data.reverse().map(({key, data}) => {
		const el = item.cloneNode(true);
		el.querySelector(".tab-saver-item").dataset.name = key;
		el.querySelector(".tab-saver-item__title").innerText = key;
		return el;
	});
	const container = items.cloneNode(true).querySelector(".tab-saver-items")
	for(const item of itemsDOM){
		container.appendChild(item);
	}
	return container;
}

function clearNode(node){
	while(node.firstChild){
		node.removeChild(node.firstChild);
	};
	return node;
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
	document.querySelector(".notification").innerText = text;
	notificationCounter++;
	sleep(6000).then(() => {
		notificationCounter--;
		if(notificationCounter === 0){
			document.querySelector(".notification").innerText = "";
		}
	})
}

//function to expand element's width.
//Actually it's a hack because you have to deal with two panel's variants:
//- in button
//- in menu
//so, while in button mode we must expand body, so it will not catch css small width query
async function expand(el, em = 40){
	const exp = document.createElement("div");
	exp.style.height = `1px`;
	exp.style.width = `${em}em`;
	el.appendChild(exp);
	await sleep(50);
	el.removeChild(exp);
}

function renderItems(data){
	clearNode(DOM.content);
	DOM.content.appendChild(render(data));
}

async function main(){
	await expand(document.querySelector(".main"));
	const bgpage = await browser.runtime.getBackgroundPage();
	renderItems(await data.get());

	attachListeners(async (event, payload = null)=>{
		const handlers = {
			"new": async (name) => {
				try{
					const d = await bgpage.addTabSet(name, await getCurrentTabs());
					renderItems(d)
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
					renderItems(d);
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
					renderItems(d);
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
					renderItems(d);
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