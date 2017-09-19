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
/******/ 	return __webpack_require__(__webpack_require__.s = 3);
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
/* 2 */,
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });

// EXTERNAL MODULE: ./src/utils.js
var utils = __webpack_require__(0);

// EXTERNAL MODULE: ./src/shared.js
var shared = __webpack_require__(1);

// CONCATENATED MODULE: ./src/tabset.js



const TabSet = {
	async save(name, tabs){
		const tabsData = tabs
		.map(x => ({
			url: x.url,
			pinned: x.pinned,
			cookieStoreId: x.cookieStoreId || shared["a" /* DEFAULT_COOKIE_STORE_ID */],
		}))
		.filter(x => {
			return !Object(utils["f" /* oneOf */])(x.url, "about:blank", "about:newtab");
		})
		.map(x => {
			x.url = Object(shared["e" /* getUnmangledURL */])(x.url);
			return x;
		});
		if(tabsData.length === 0){
			throw new Error("TabSet is empty");
		};
		const d = await shared["b" /* data */].get();
		const index = Object(utils["c" /* firstIndex */])(d, x => {
			return x.key === name;
		});
		if (index > -1){
			d[index].data = tabsData;
		} else {
			d.push({
				key: name,
				data: tabsData,
			});
		}
		await shared["b" /* data */].set(d);
		return await shared["b" /* data */].get();
	},
	async add(name, tabs){
		if(name === null){
			name = Object(shared["c" /* getDefaultTabSetName */])();
		};
		const d = await shared["b" /* data */].get();
		if (Object(utils["b" /* first */])(d, x => {
			return x.key === name;
		}) !== null){
			throw new Error("Name exists");
		};
		for(let set of d){
			if(Object(shared["h" /* tabSetsAreEqual */])(
				set.data.map(x => Object(shared["e" /* getUnmangledURL */])(x.url)),
				tabs.map(x => Object(shared["e" /* getUnmangledURL */])(x.url))
			)){
				throw new Error(`Set exists under name "${set.key}"`);
			}
		};
		return await this.save(name, tabs);
	},
	async open(name){
		const tabset = Object(utils["b" /* first */])(await shared["b" /* data */].get(), x => x.key === name);
		if(tabset === null){
			throw new Error("Unknown TabSet");
		}
		const windows = await browser.windows.getAll({populate:true});
		for(let window of windows){
			if(Object(shared["h" /* tabSetsAreEqual */])(
				tabset.data.map(x => x.url),
				window.tabs.map(x => Object(shared["e" /* getUnmangledURL */])(x.url))
			)){
				await browser.windows.update(window.id, {focused:true})
				return window.id;
			};
		};
		const allowedTabs = tabset.data.map(x => {
			x.url = Object(shared["d" /* getMangledURL */])(x.url);
			return x;
		});
		const window = await browser.windows.create();
		const tabNeedToBeClosed = window.tabs[0];
		for(const [index, tab] of allowedTabs.entries()){
			const props = {
				url: tab.url,
				windowId: window.id,
				pinned: Object(utils["d" /* getKey */])(tab, "pinned", false),
				cookieStoreId: Object(utils["d" /* getKey */])(tab, "cookieStoreId", shared["a" /* DEFAULT_COOKIE_STORE_ID */]),
				active: false,
			};
			try{
				await browser.tabs.create(props);
			} catch (e) {
				if(e.message.indexOf("No cookie store exists with ID") === 0){
					props.url =	`/html/handler.html?url=${encodeURIComponent(tab.url)}&containerRemoved=true`;
					props.cookieStoreId = shared["a" /* DEFAULT_COOKIE_STORE_ID */];
					await browser.tabs.create(props);
				} else {
					throw e;
				}
			}
			if(index === 0) await browser.tabs.remove(tabNeedToBeClosed.id);
		}
		return window.id;
	},
	async rename(oldn, newn){
		const d = await shared["b" /* data */].get();

		const newExists = Object(utils["c" /* firstIndex */])(d, x => {
			return x.key === newn;
		}) > -1;
		if(newExists) throw new Error("Name already exists");

		const index = Object(utils["c" /* firstIndex */])(d, x => {
			return x.key === oldn;
		});
		if(index === -1) throw new Error("Unknown TabSet");

		d[index].key = newn;
		await shared["b" /* data */].set(d);
		return await shared["b" /* data */].get();
	},
	async remove(name){
		const d = await shared["b" /* data */].get();
		const index = Object(utils["c" /* firstIndex */])(d, x => {
			return x.key === name;
		});
		if(index === -1) throw new Error("Unknown TabSet");

		d.splice(index, 1);
		await shared["b" /* data */].set(d);
		return await shared["b" /* data */].get();
	},
}

async function load(){
	await load();
}
// CONCATENATED MODULE: ./src/background.js




async function main(){
	await Object(shared["f" /* load */])();

	window.import = async () => {
		const imported = await Object(utils["j" /* readFileAsJson */])();
		await shared["b" /* data */].set(imported);
	}

	window.export = async () => {
		const out = JSON.stringify(await shared["b" /* data */].get(), null, 2);
		try{
			await Object(utils["k" /* saveFile */])(out, "export.tabsaver.json");
		} catch (e) {};
	}

	window.TabSet = TabSet;
	window.openURL = shared["g" /* openURL */];
}

main().catch(err => console.error(err));


/***/ })
/******/ ]);