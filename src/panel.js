import {
	live,
	sleep,
	oneOf,
	findParent,
	withDefault,
	getKey,
	tryOR,
} from "./utils.js";
import {
	DEFAULT_COOKIE_STORE_ID,
	data,
	openURL,
	getMangledURL,
	load as loadShared,
} from "./shared.js";

const DOM = {
	content: document.querySelector(".content"),
	pinnedInput: document.querySelector(".prefs__pinned-input"),
	new: {
		input: document.querySelector(".save-new__input"),
		button: document.querySelector(".save-new__button"),
	},
	import: document.querySelector(".prefs__import"),
	export: document.querySelector(".prefs__export"),
};

const templates = [
	"tab-saver-items",
	"tab-saver-item",
	"tab-saver-item__link",
]
.reduce((c, x) => {
	c[x] = document.querySelector("#"+x).content.querySelector("."+x);
	return c;
}, {});

function getTemplate(tpl){
	return templates[tpl].cloneNode(true);
}

async function renderTab(tab){
	const identity = await tryOR(
		async () => await browser.contextualIdentities.get(getKey(tab, "cookieStoreId", DEFAULT_COOKIE_STORE_ID)),
		null
	);
	const link = getTemplate("tab-saver-item__link");
	link.href = tab.url;
	link.target = "_blank";
	link.innerText = tab.url;
	link.title = tab.url;
	if(identity){
		link.dataset.identityName = identity.name;
		link.dataset.identityId = identity.cookieStoreId;
		link.dataset.identityColor = identity.color;
		link.style.setProperty("--color", identity.color);
	};
	return link;
}

async function render(data){
	const itemsDOM = await Promise.all(
		data.reverse()
		.map(async ({key, data}) => {
			const el = getTemplate("tab-saver-item");
			el.dataset.name = key;
			el.querySelector(".tab-saver-item__title").innerText = key;
			const linksContainer = el.querySelector(".tab-saver-item__links");
			for(const tab of data){
				linksContainer.appendChild(await renderTab(tab));
			};
			return el;
		})
	);
	const container = getTemplate("tab-saver-items");
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
			await callback("new", DOM["new"].input.value);
		} else {
			await callback("new", null);
		}
		DOM["new"].input.value = "";
	});
	DOM.new.input.addEventListener("keydown", e => {
		if (e.which === 13) DOM.new.button.click();
	});
	DOM.pinnedInput.addEventListener("change", function(e){
		callback("pinned:change", this.checked);
	});
	["save", "open", "remove"].forEach(event => {
		live(DOM.content, ".tab-saver-item__button-" + event, "click", async function() {
			let parent = findParent(this, ".tab-saver-item");
			await callback("item:" + event, parent.dataset.name);
		});
	});
	live(DOM.content, ".tab-saver-item__title", "click", async function() {
		await sleep(20);
		if(this.contentEditable === "true") return;
		const dataset = findParent(this, ".tab-saver-item").dataset;
		dataset.urlsCollapsed = dataset.urlsCollapsed === "false" ? "true" : "false";
	});
	live(DOM.content, ".tab-saver-item__title", "dblclick", async function() {
		this.contentEditable = true;
		this.focus();
		document.execCommand("selectAll", false, null);
	});
	live(DOM.content, ".tab-saver-item__link", "click", async function(e) {
		e.preventDefault();
		await openURL(this.href, this.dataset.identityId);
	});
	live(DOM.content, ".tab-saver-item__button-more", "click", async function(e) {
		const parent = findParent(this, ".tab-saver-item");
		parent.dataset.actionsCollapsed = false;
		parent.addEventListener("mouseleave", function handler(e){
			parent.dataset.actionsCollapsed = true;
			parent.removeEventListener("mouseleave", handler);
		});
	});
	live(DOM.content, ".tab-saver-item__button-down", "click", async function(e) {
		const parent = findParent(this, ".tab-saver-item");
		callback("item:movedown", parent.dataset.name);
	});
	live(DOM.content, ".tab-saver-item__button-up", "click", async function(e) {
		const parent = findParent(this, ".tab-saver-item");
		callback("item:moveup", parent.dataset.name);
	});
	live(
		DOM.content,
		".tab-saver-item__title[contenteditable=true]",
		"keydown",
		async function(e) {
			if (e.which === 13) {
				e.preventDefault();
				const oldv = findParent(this, ".tab-saver-item").dataset.name;
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

async function renderItems(items){
	const el = DOM.content.querySelector(".tab-saver-items");
	if(el){
		DOM.content.replaceChild(await render(items), el);
	} else {
		DOM.content.appendChild(await render(items));
	}
	DOM.pinnedInput.checked = await data.getPinned();
}

async function main(){
	await expand(document.querySelector(".main"));
	await renderItems(await data.get());
	const bgpage = await browser.runtime.getBackgroundPage();

	attachListeners(async (event, payload = null)=>{
		const handlers = {
			"new": async (name) => {
				try{
					const d = await bgpage.TabSet.add(name, await getCurrentTabs());
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
				const windowId = await bgpage.TabSet.open(name);
				const currentWindow = await browser.windows.getCurrent();
				if(windowId === currentWindow.id){
					notify("Tabset is open in current window");
				}
			},
			"item:save": async (name) => {
				try{
					const d = await bgpage.TabSet.save(name, await getCurrentTabs());
					notify(`"${name}" saved`);
				} catch (e) {
					if(e.message === "Unknown TabSet"){
						notify(e.message);
					} else if(e.message === "TabSet is empty") {
						notify("Window have no tabs");
					} else {
						notify("Some error occured");
						console.error(e);
					}
				}
			},
			"item:remove": async (name) => {
				try{
					const d = await bgpage.TabSet.remove(name);
					notify(`"${name}" removed`);
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
					const d = await bgpage.TabSet.rename(oldn, newn);
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
			"item:moveup": async (name) => {
				try{
					await bgpage.TabSet.moveup(name);
				} catch (e) {
					switch (e.message){
						case "Out of bound move":
							notify("Cannot move top item");
							break;
						default:
							notify("Some error occured");
					}
					console.error(e);
				};
			},
			"item:movedown": async (name) => {
				try{
					await bgpage.TabSet.movedown(name);
				} catch (e) {
					switch (e.message){
						case "Out of bound move":
							notify("Cannot move bottom item");
							break;
						default:
							notify("Some error occured");
					}
					console.error(e);
				};
			},
			"pinned:change": async (val) => {
				await data.setPinned(val);
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

	await sleep(200);
	DOM.new.input.focus();

	browser.storage.onChanged.addListener(async e => {
		renderItems(await data.get());
	});
}

main().catch(err => console.error(err));