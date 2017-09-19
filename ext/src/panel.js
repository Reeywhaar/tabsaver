/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["p"] = withDefault;
/* harmony export (immutable) */ __webpack_exports__["m"] = sleep;
/* harmony export (immutable) */ __webpack_exports__["i"] = pipe;
/* harmony export (immutable) */ __webpack_exports__["k"] = saveFile;
/* unused harmony export readFile */
/* harmony export (immutable) */ __webpack_exports__["j"] = readFileAsJson;
/* harmony export (immutable) */ __webpack_exports__["b"] = first;
/* harmony export (immutable) */ __webpack_exports__["c"] = firstIndex;
/* harmony export (immutable) */ __webpack_exports__["l"] = setsAreEqual;
/* harmony export (immutable) */ __webpack_exports__["e"] = live;
/* unused harmony export once */
/* harmony export (immutable) */ __webpack_exports__["f"] = oneOf;
/* harmony export (immutable) */ __webpack_exports__["n"] = strAfter;
/* harmony export (immutable) */ __webpack_exports__["d"] = getKey;
/* harmony export (immutable) */ __webpack_exports__["g"] = padLeft;
/* harmony export (immutable) */ __webpack_exports__["h"] = parseQuery;
/* harmony export (immutable) */ __webpack_exports__["a"] = findParent;
/* harmony export (immutable) */ __webpack_exports__["o"] = tryOR;
function withDefault(obj, def){
	if(obj === null || typeof obj === "undefined"){
		return def;
	}
	return obj;
}

function sleep(n){
	return new Promise(resolve => {
		setTimeout(resolve, n);
	});
}

function pipe(obj, ...fns){
	return fns.reduce((c, fn)=>{
		return (c instanceof Promise) ? c.then(c => fn(c)) : fn(c);
	}, obj);
}

async function saveFile(value, fileName, fileType="application/json"){
	const host = document.body;
	const blob = new Blob([value], {type: fileType});
	const url = URL.createObjectURL(blob);

	await browser.downloads.download({
		url,
		filename: fileName,
		saveAs: true,
	});
}

function readFile(accept = ".json"){
	function readContent(file){
		return new Promise(resolve => {
			const fr = new FileReader();
			fr.onload = function(e){
				resolve(e.target.result);
			}
			fr.readAsText(file);
		})
	}
	return new Promise((resolve, reject) => {
		const input = document.createElement("input");
		const host = document.body;
		input.type = "file";
		input.accept = accept;
		input.value = null;
		input.style.display = "none";
		host.appendChild(input);
		input.addEventListener("change", async function(e) {
			if (e.target.files.length < 1) {
				reject(new Error("no file was selected"));
			}
			try{
				resolve(await readContent(e.target.files[0]));
				host.removeChild(input);
			} catch (e) {
				reject(new Error("error while reading import file"));
				host.removeChild(input);
			}
			host.removeChild(input);
		}, false);
		input.click();
	})
}

async function readFileAsJson(){
	return JSON.parse(await readFile());
}

function first(array, fn){
	for(let item of array){
		if(fn(item)) return item;
	}
	return null;
}

function firstIndex(array, fn){
	const item = first(array, fn);
	return array.indexOf(item);
}

function setsAreEqual(setA, setB){
	setB = setB.slice(0);
	if(setA.length !== setB.length){
		return false;
	};
	for(let item of setA){
		if(setB.length < 1) return false;
		const index = setB.indexOf(item);
		if (index === -1){
			return false;
		};
		setB.splice(index, 1);
	}
	return true;
}

function live(parent, selector, event, fn, capture = false) {
	parent.addEventListener(
		event,
		function(e) {
			if (e.target.matches(selector)) {
				fn.call(e.target, e);
			}
		},
		capture
	);
}

function once(node, type, fn, capture = false) {
	return node.addEventListener(type, function handler(e) {
		node.removeEventListener(type, handler);
		return fn.call(node, e);
	}, capture);
}

function oneOf(obj, ...subjs){
	for(let subj of subjs){
		if(obj === subj) return true;
	};
	return false;
}

function strAfter(str, search){
	if(str.indexOf(search) === -1) return str;
	return str.substr(str.indexOf(search) + search.length);
}

function getKey(obj, key, def = null){
	if(key in obj) return obj[key];
	return def;
}

function padLeft(length, padder = " ", str){
	str = str.toString();
	if(str.length >= length) return str;
	return padder.repeat(length - str.length) + str;
}

function parseQuery(query){
	return query
	.substr(1)
	.split("&")
	.map(x => {
		return x
		.split("=")
		.map(x => decodeURIComponent(x));
	}).reduce((c, x) => {
		c[x[0]] = x[1];
		return c;
	}, {});
}

function findParent(el, selector){
	while((el = el.parentElement) && !el.matches(selector) && el !== document){}
	return el;
}

async function tryOR(fn, def = null){
	try{
		return await fn();
	} catch (e) {
		return def;
	}
}

/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export isURLPrivileged */
/* harmony export (immutable) */ __webpack_exports__["d"] = getMangledURL;
/* harmony export (immutable) */ __webpack_exports__["e"] = getUnmangledURL;
/* harmony export (immutable) */ __webpack_exports__["h"] = tabSetsAreEqual;
/* harmony export (immutable) */ __webpack_exports__["g"] = openURL;
/* harmony export (immutable) */ __webpack_exports__["c"] = getDefaultTabSetName;
/* harmony export (immutable) */ __webpack_exports__["f"] = load;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__utils_js__ = __webpack_require__(0);


const DEFAULT_COOKIE_STORE_ID = "firefox-default";
/* harmony export (immutable) */ __webpack_exports__["a"] = DEFAULT_COOKIE_STORE_ID;


const data = {
	async set(data){
		await browser.storage.local.set({
			"tabs": data,
		});
	},
	async get(){
		return await Object(__WEBPACK_IMPORTED_MODULE_0__utils_js__["i" /* pipe */])(
			browser.storage.local.get("tabs").then(x => x.tabs ? x.tabs : null),
			x => Object(__WEBPACK_IMPORTED_MODULE_0__utils_js__["p" /* withDefault */])(x, []),
		);
	},
}
/* harmony export (immutable) */ __webpack_exports__["b"] = data;


//will be set in load
let extensionURL;

function isURLPrivileged(url){
	if(url === "about:blank") return false;
	if(/^(chrome|javascript|data|file|about)\:/.test(url)) return true;
	return false;
}

function getMangledURL(url){
	if(isURLPrivileged(url)) return `/html/handler.html?url=${encodeURIComponent(url)}`;
	return url;
}

function getUnmangledURL(url){
	if(url.indexOf(extensionURL) === 0){
		const qu = Object(__WEBPACK_IMPORTED_MODULE_0__utils_js__["h" /* parseQuery */])("?" + Object(__WEBPACK_IMPORTED_MODULE_0__utils_js__["n" /* strAfter */])(url, "handler.html?"));
		return qu.url;
	};
	return url;
}

function tabSetsAreEqual(setA, setB){
	setA = setA.filter(x => {
		return !Object(__WEBPACK_IMPORTED_MODULE_0__utils_js__["f" /* oneOf */])(x, "", "about:blank", "about:newtab");
	})
	setB = setB.filter(x => {
		return !Object(__WEBPACK_IMPORTED_MODULE_0__utils_js__["f" /* oneOf */])(x, "", "about:blank", "about:newtab");
	})
	return Object(__WEBPACK_IMPORTED_MODULE_0__utils_js__["l" /* setsAreEqual */])(setA, setB);
}

async function openURL(url, cookieStoreId = DEFAULT_COOKIE_STORE_ID){
	return await browser.tabs.create({url: getMangledURL(url), cookieStoreId});
}

function getDefaultTabSetName(){
	const date = new Date();
	const pl = __WEBPACK_IMPORTED_MODULE_0__utils_js__["g" /* padLeft */].bind(null, 2, "0");
	return `${date.getFullYear()}-${pl(date.getMonth()+1)}-${pl(date.getDate())} ${pl(date.getHours())}:${pl(date.getMinutes())}`;
}

async function load(){
	extensionURL = browser.extension.getURL("/html/handler.html");
}


/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__utils_js__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__shared_js__ = __webpack_require__(1);



const DOM = {
	content: document.querySelector(".content"),
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
.map(x => {
	return [x, document.querySelector("#"+x).content.querySelector("."+x)];
})
.reduce((c, x) => {
	c[x[0]] = x[1];
	return c;
}, {});

function getTemplate(tpl){
	return templates[tpl].cloneNode(true);
}

async function renderTab(tab){
	const identity = await Object(__WEBPACK_IMPORTED_MODULE_0__utils_js__["o" /* tryOR */])(
		async () => await browser.contextualIdentities.get(Object(__WEBPACK_IMPORTED_MODULE_0__utils_js__["d" /* getKey */])(tab, "cookieStoreId", __WEBPACK_IMPORTED_MODULE_1__shared_js__["a" /* DEFAULT_COOKIE_STORE_ID */])),
		null
	);
	const link = getTemplate("tab-saver-item__link");
	link.href = tab.url;
	link.target = "_blank";
	link.innerText = tab.url;
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
			linksContainer.classList.add("hidden");
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
	["save", "open", "remove"].forEach(event => {
		Object(__WEBPACK_IMPORTED_MODULE_0__utils_js__["e" /* live */])(DOM.content, ".tab-saver-item .btn-" + event, "click", async function() {
			let parent = Object(__WEBPACK_IMPORTED_MODULE_0__utils_js__["a" /* findParent */])(this, ".tab-saver-item");
			await callback("item:" + event, parent.dataset.name);
		});
	});
	Object(__WEBPACK_IMPORTED_MODULE_0__utils_js__["e" /* live */])(DOM.content, ".tab-saver-item__title", "click", async function() {
		await Object(__WEBPACK_IMPORTED_MODULE_0__utils_js__["m" /* sleep */])(20);
		if(this.contentEditable === "true") return;
		Object(__WEBPACK_IMPORTED_MODULE_0__utils_js__["a" /* findParent */])(this, ".tab-saver-item").querySelector(".tab-saver-item__links").classList.toggle("hidden");
	});
	Object(__WEBPACK_IMPORTED_MODULE_0__utils_js__["e" /* live */])(DOM.content, ".tab-saver-item__title", "dblclick", async function() {
		this.contentEditable = true;
		this.focus();
		document.execCommand("selectAll", false, null);
	});
	Object(__WEBPACK_IMPORTED_MODULE_0__utils_js__["e" /* live */])(DOM.content, ".tab-saver-item__link", "click", async function(e) {
		e.preventDefault();
		await Object(__WEBPACK_IMPORTED_MODULE_1__shared_js__["g" /* openURL */])(this.href, this.dataset.identityId);
	});
	Object(__WEBPACK_IMPORTED_MODULE_0__utils_js__["e" /* live */])(
		DOM.content,
		".tab-saver-item__title[contenteditable=true]",
		"keydown",
		async function(e) {
			if (e.which === 13) {
				e.preventDefault();
				const oldv = Object(__WEBPACK_IMPORTED_MODULE_0__utils_js__["a" /* findParent */])(this, ".tab-saver-item").dataset.name;
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
	Object(__WEBPACK_IMPORTED_MODULE_0__utils_js__["m" /* sleep */])(6000).then(() => {
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
	await Object(__WEBPACK_IMPORTED_MODULE_0__utils_js__["m" /* sleep */])(50);
	el.removeChild(exp);
}

async function renderItems(data){
	const el = DOM.content.querySelector(".tab-saver-items");
	if(el){
		DOM.content.replaceChild(await render(data), el);
	} else {
		DOM.content.appendChild(await render(data));
	}
}

async function main(){
	await expand(document.querySelector(".main"));
	await renderItems(await __WEBPACK_IMPORTED_MODULE_1__shared_js__["b" /* data */].get());
	const bgpage = await browser.runtime.getBackgroundPage();

	attachListeners(async (event, payload = null)=>{
		const handlers = {
			"new": async (name) => {
				try{
					const d = await bgpage.TabSet.add(name, await getCurrentTabs());
				} catch (e) {
					if(Object(__WEBPACK_IMPORTED_MODULE_0__utils_js__["f" /* oneOf */])(e.message, "Name exists", "TabSet is empty")){
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

	await Object(__WEBPACK_IMPORTED_MODULE_0__utils_js__["m" /* sleep */])(200);
	DOM.new.input.focus();

	browser.storage.onChanged.addListener(async e => {
		renderItems(await __WEBPACK_IMPORTED_MODULE_1__shared_js__["b" /* data */].get());
	});
}

main().catch(err => console.error(err));

/***/ })
/******/ ]);