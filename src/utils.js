export function withDefault(obj, def) {
  if (obj === null || typeof obj === "undefined") {
    return def;
  }
  return obj;
}

/**
 *
 * @param {number} n
 */
export function sleep(n) {
  return new Promise((resolve) => setTimeout(resolve, n));
}

export function pipe(obj, ...fns) {
  return fns.reduce(
    (c, fn) => (c instanceof Promise ? c.then((c) => fn(c)) : fn(c)),
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
    return new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = function (e) {
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
      async function (e) {
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

/**
 *
 * @param {any[]} array
 * @param {function} fn
 */
export function firstIndex(array, fn) {
  return Array.from(array).findIndex(fn);
}

/**
 *
 * @param {any[]} array
 * @param {function} fn
 */
export function first(array, fn) {
  return Array.from(array).find(fn) || null;
}

/**
 * Checks if two arrays are contain same elements
 *
 * @param {any[]} setA
 * @param {any[]} setB
 */
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

/**
 * Binds event handler to host
 *
 * @param {HTMLElement} host host to bind event
 * @param {string} selector host child selector
 * @param {string} event event name
 * @param {function} fn event handler
 * @param {boolean} capture capture/bubble mode
 */
export function live(host, selector, event, fn, capture = false) {
  host.addEventListener(
    event,
    (e) => {
      if (e.target.matches(selector)) fn.call(e.target, e);
    },
    capture
  );
}

/**
 * Bind event and removes once event occured
 *
 * @param {HTMLElement} node element
 * @param {string} type event name
 * @param {function} fn handler
 * @param {boolean} capture capture/bubble mode (false)
 */
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

/**
 *
 * @param {number} length
 * @param {string} padder
 * @param {string} str
 */
export function padLeft(length, padder = " ", str) {
  str = str.toString();
  if (str.length >= length) return str;
  return padder.repeat(length - str.length) + str;
}

export function parseQuery(query) {
  return query
    .substr(1) // remove "?"
    .split("&")
    .map((x) => {
      return x.split("=").map((x) => decodeURIComponent(x));
    })
    .reduce((c, [key, value]) => {
      if (key) c[key] = value;
      return c;
    }, {});
}

/**
 *
 * @param {HTMLElement} el
 * @param {string} selector
 */
export function findParent(el, selector) {
  while (!el.matches(selector)) {
    if (el === document.body) return null;
    el = el.parentElement;
  }
  return el;
}

/**
 *
 * @param {function} fn
 * @param {any} def
 */
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

/**
 *
 * @param {function} fn
 * @param {number} interval
 */
export async function waitUntil(fn, interval = 100) {
  while (!(await fn())) {
    await sleep(interval);
  }
}

/**
 *
 * @param {HTMLElement} el
 * @param {string} selector
 */
export function parentMatching(el, selector) {
  while (el !== document.body.parentElement) {
    if (el.matches(selector)) return el;
    el = el.parentElement;
  }
  return null;
}

/**
 * Calculates wheter event occured in bottom or top half
 * of element
 *
 * @param {Event} event
 */
export function eventYProportion(event, target = event.currentTarget) {
  const rect = target.getBoundingClientRect();
  const y = event.clientY - rect.y;
  const proportion = y / rect.height;
  return proportion >= 0.5;
}

export function serialize(object) {
  return JSON.parse(JSON.stringify(object));
}
