export function sleep(n: number) {
  return new Promise((resolve) => setTimeout(resolve, n));
}

export async function saveFile(
  value: BlobPart,
  fileName: string,
  fileType: string = "application/json"
) {
  const blob = new Blob([value], { type: fileType });
  const url = URL.createObjectURL(blob);

  await browser.downloads.download({
    url,
    filename: fileName,
    saveAs: true,
  });
}

export function readFile(accept: string = ".json") {
  function readContent(file: File) {
    return new Promise<string>((resolve) => {
      const fr = new FileReader();
      fr.onload = function (e) {
        resolve(e.target!.result as string);
      };
      fr.readAsText(file);
    });
  }
  return new Promise<string>((resolve, reject) => {
    const input = document.createElement("input");
    const host = document.body;
    input.type = "file";
    input.accept = accept;
    input.value = "";
    input.style.display = "none";
    host.appendChild(input);
    input.addEventListener(
      "change",
      async function (e) {
        const trg = e.target as HTMLInputElement;
        const file = trg.files?.[0];
        if (!file) {
          reject(new Error("no file was selected"));
          return;
        }

        try {
          resolve(await readContent(file));
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

export function first<T>(array: ArrayLike<T>, fn: (v: T) => boolean) {
  return Array.from(array).find(fn) || null;
}

/**
 * Checks if two arrays are contain same elements
 */
export function setsAreEqual<T>(setA: T[], setB: T[]) {
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
 */
export function live(
  host: HTMLElement,
  selector: string,
  event: string,
  fn: (this: HTMLElement, event: Event) => unknown,
  capture = false
) {
  host.addEventListener(
    event,
    (e) => {
      if (!e.target || !(e.target instanceof HTMLElement)) return;
      if (e.target.matches(selector)) fn.call(e.target, e);
    },
    capture
  );
}

/**
 * Bind event and removes once event occured
 */
export function once(
  node: HTMLElement,
  type: string,
  fn: (this: HTMLElement, event: Event) => unknown,
  capture = false
) {
  return node.addEventListener(
    type,
    function handler(e) {
      node.removeEventListener(type, handler);
      return fn.call(node, e);
    },
    capture
  );
}

export function oneOf<T>(obj: T, ...subjs: T[]) {
  for (let subj of subjs) {
    if (obj === subj) return true;
  }
  return false;
}

export function strAfter(str: string, search: string) {
  if (str.indexOf(search) === -1) return str;
  return str.substr(str.indexOf(search) + search.length);
}

export function padLeft(length: number, padder = " ", str: string) {
  str = str.toString();
  if (str.length >= length) return str;
  return padder.repeat(length - str.length) + str;
}

export function parseQuery(query: string) {
  return query
    .substr(1) // remove "?"
    .split("&")
    .map((x) => {
      return x.split("=").map((x) => decodeURIComponent(x));
    })
    .reduce<Record<string, any>>((c, [key, value]) => {
      if (key) c[key] = value;
      return c;
    }, {});
}

export function findParent(el: HTMLElement, selector: string) {
  let iel: HTMLElement | undefined = el;
  while (!iel?.matches(selector)) {
    if (iel === document.body) return null;
    iel = iel?.parentElement ?? undefined;
  }
  return iel;
}

export async function tryOR<T>(fn: () => T, def: T | null = null) {
  try {
    return await fn();
  } catch (e) {
    return def;
  }
}

export function moveArrayItem<T>(arr: T[], index: number, offset: number) {
  if (offset < 0 && index + offset < 0) throw new Error("Out of bound move");
  if (offset >= 0 && index + offset > arr.length - 1)
    throw new Error("Out of bound move");
  const item = arr.splice(index, 1)[0];
  arr.splice(index + offset, 0, item);
  return arr;
}

export function* reverse<T>(iterable: T[]) {
  const len = iterable.length;
  for (let i = len - 1; i >= 0; i--) {
    yield iterable[i];
  }
}

export function cutString(str: string, len: number, ellipsis = "") {
  if (str.length <= len) return str;
  return str.substring(0, len - ellipsis.length) + ellipsis;
}

export function debounce<T extends (...args: any[]) => unknown>(
  fn: T,
  delay: number,
  immediate: boolean = false
) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    const cb = () => {
      timeout = null;
      if (!immediate) fn(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout ?? undefined);
    timeout = setTimeout(cb, delay);
    if (callNow) fn(...args);
  };
}

export async function waitUntil(fn: () => Promise<boolean>, interval = 100) {
  while (!(await fn())) {
    await sleep(interval);
  }
}

export function parentMatching(el: HTMLElement, selector: string) {
  while (el !== document.body.parentElement) {
    if (el.matches(selector)) return el;
    if (!el.parentElement) return null;
    el = el.parentElement;
  }
  return null;
}

/**
 * Calculates wheter event occured in bottom or top half
 * of element
 */
export function eventYProportion(
  event: Event & { clientY: number },
  target = event.currentTarget
) {
  const rect = (target as HTMLElement).getBoundingClientRect();
  const y = event.clientY - rect.y;
  const proportion = y / rect.height;
  return proportion >= 0.5;
}

export function serialize(object: any) {
  return JSON.parse(JSON.stringify(object));
}

export async function processListeners(
  listeners: ((key: string, value: any) => unknown)[],
  key: string,
  value: any,
  blocking = false
) {
  let error: unknown | null = null;
  for (const cb of listeners) {
    try {
      if (blocking) {
        await cb(key, value);
      } else {
        cb(key, value);
      }
    } catch (e) {
      if (isDeadObjectError(e)) {
        listeners.splice(listeners.indexOf(cb), 1);
      } else {
        if (!error) error = e;
      }
    }
  }
  if (error) throw error;
}

export function isNil<T>(v: T | null | undefined): v is null | undefined {
  return v === null || v === undefined;
}

export function isNotNil<T>(v: T | null | undefined): v is T {
  return !isNil(v);
}

function isDeadObjectError(e: any) {
  return e instanceof TypeError && e.message === "can't access dead object";
}
