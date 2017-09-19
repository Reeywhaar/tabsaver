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
/******/ 	return __webpack_require__(__webpack_require__.s = 4);
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
/* 1 */,
/* 2 */,
/* 3 */,
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__utils_js__ = __webpack_require__(0);


function getURL(){
	return decodeURIComponent(window.location.search.substr(5));
}

function copyToClipboard(text){
	const input = document.createElement("input");
	input.setAttribute("value", text);
	document.body.appendChild(input);
	input.select();
	document.execCommand("copy");
	document.body.removeChild(input);
}

let notificationCounter = 0;
function notify(text){
	const el = document.querySelector(".notification");
	el.innerText = text;
	notificationCounter++;
	Object(__WEBPACK_IMPORTED_MODULE_0__utils_js__["m" /* sleep */])(6000).then(() => {
		notificationCounter--;
		if(notificationCounter < 1){
			el.innerText = "";
		};
	});
}

function createLink(href, text){
	const a = document.createElement("a");
	a.href = href;
	a.innerText = text;
	return a;
}

function getTemplate(selector){
	return document.querySelector(selector).content.cloneNode(true);
}

function loadTemplate(selector){
	document.body.appendChild(getTemplate(selector));
}

function showRestricted(url){
	loadTemplate("#restricted");
	document.title = url;
	const urlEl = document.querySelector(".url");
	const link = createLink(url, url)
	urlEl.appendChild(link);
	link.addEventListener("click", (e) => {
		e.preventDefault();
		copyToClipboard(url);
		notify("Copied to Clipboard");
	});
}

function showContainerRemoved(url){
	loadTemplate("#container-removed");
	document.title = url;
	const urlEl = document.querySelector(".url");
	const link = createLink(url, url)
	urlEl.appendChild(link);
	link.addEventListener("click", (e) => {
		e.preventDefault();
		window.location.replace(url);
	});
}

async function main(){
	const query = Object(__WEBPACK_IMPORTED_MODULE_0__utils_js__["h" /* parseQuery */])(window.location.search);
	if("containerRemoved" in query){
		showContainerRemoved(query.url);
	} else {
		showRestricted(query.url);
	}
}

main().catch(e => console.error(e));

/***/ })
/******/ ]);