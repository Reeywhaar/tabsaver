export function withDefault(obj, def) {
	if (obj === null || typeof obj === "undefined") {
		return def;
	}
	return obj;
}

export function sleep(n) {
	return new Promise(resolve => setTimeout(resolve, n));
}

export function pipe(obj, ...fns) {
	return fns.reduce(
		(c, fn) => (c instanceof Promise ? c.then(c => fn(c)) : fn(c)),
		obj
	);
}

export async function saveFile(value, fileName, fileType = "application/json") {
	const blob = new Blob([value], { type: fileType });
	const url = URL.createObjectURL(blob);

	await browser.downloads.download({
		url,
		filename: fileName,
		saveAs: true,
	});
}

export function readFile(accept = ".json") {
	function readContent(file) {
		return new Promise(resolve => {
			const fr = new FileReader();
			fr.onload = function(e) {
				resolve(e.target.result);
			};
			fr.readAsText(file);
		});
	}
	return new Promise((resolve, reject) => {
		const input = document.createElement("input");
		const host = document.body;
		input.type = "file";
		input.accept = accept;
		input.value = null;
		input.style.display = "none";
		host.appendChild(input);
		input.addEventListener(
			"change",
			async function(e) {
				if (e.target.files.length < 1)
					reject(new Error("no file was selected"));

				try {
					resolve(await readContent(e.target.files[0]));
				} catch (e) {
					reject(new Error("error while reading import file"));
				} finally {
					host.removeChild(input);
				}
			},
			false
		);
		input.click();
	});
}

export async function readFileAsJson() {
	return JSON.parse(await readFile());
}

export function firstIndex(array, fn) {
	for (let [index, item] of array.entries()) {
		if (fn(item)) return index;
	}
	return -1;
}

export function first(array, fn) {
	const index = firstIndex(array, fn);
	if (index === -1) return null;
	return array[index];
}

export function setsAreEqual(setA, setB) {
	setB = setB.slice(0);
	if (setA.length !== setB.length) return false;

	for (let item of setA) {
		if (setB.length < 1) return false;
		const index = setB.indexOf(item);
		if (index === -1) return false;
		setB.splice(index, 1);
	}
	return true;
}

export function live(host, selector, event, fn, capture = false) {
	host.addEventListener(
		event,
		e => {
			if (e.target.matches(selector)) {
				fn.call(e.target, e);
			}
		},
		capture
	);
}

export function once(node, type, fn, capture = false) {
	return node.addEventListener(
		type,
		function handler(e) {
			node.removeEventListener(type, handler);
			return fn.call(node, e);
		},
		capture
	);
}

export function oneOf(obj, ...subjs) {
	for (let subj of subjs) {
		if (obj === subj) return true;
	}
	return false;
}

export function strAfter(str, search) {
	if (str.indexOf(search) === -1) return str;
	return str.substr(str.indexOf(search) + search.length);
}

export function getKey(obj, key, def = null) {
	if (key in obj) return obj[key];
	return def;
}

export function padLeft(length, padder = " ", str) {
	str = str.toString();
	if (str.length >= length) return str;
	return padder.repeat(length - str.length) + str;
}

export function parseQuery(query) {
	return query
		.substr(1) // remove "?"
		.split("&")
		.map(x => {
			return x.split("=").map(x => decodeURIComponent(x));
		})
		.reduce((c, [key, value]) => {
			if (key) c[key] = value;
			return c;
		}, {});
}

export function findParent(el, selector) {
	while (true) {
		if (el.matches(selector)) return el;
		if (el === document) return null;
		el = el.parentElement;
	}
}

export async function tryOR(fn, def = null) {
	try {
		return await fn();
	} catch (e) {
		return def;
	}
}

export function moveArrayItem(arr, index, offset) {
	if (offset < 0 && index + offset < 0) throw new Error("Out of bound move");
	if (offset >= 0 && index + offset > arr.length - 1)
		throw new Error("Out of bound move");
	const item = arr.splice(index, 1)[0];
	arr.splice(index + offset, 0, item);
	return arr;
}

export function* reverse(iterable) {
	const len = iterable.length;
	for (let i = len - 1; i >= 0; i--) {
		yield iterable[i];
	}
}

export function abortablePromise(fn) {
	const subscribe = {};
	subscribe.on = fn => {
		subscribe.listener = fn;
	};
	subscribe.fire = () => {
		if (!subscribe.listener) return;
		subscribe.listener();
	};
	const promise = new Promise((resolve, reject) => {
		fn(resolve, reject, subscribe.on);
	});
	promise.abort = () => subscribe.fire();
	return promise;
}

export function cutString(str, len, ellipsis = "") {
	if (str.length <= len) return str;
	return str.substr(0, len - ellipsis.length) + ellipsis;
}

export function debounce(fn, delay, immediate) {
	let timeout;
	return (...args) => {
		const cb = () => {
			timeout = null;
			if (!immediate) fn(...args);
		};
		const callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(cb, delay);
		if (callNow) fn(...args);
	};
}

export async function waitUntil(fn, interval = 100) {
	while (!(await fn())) {
		await sleep(interval);
	}
}
