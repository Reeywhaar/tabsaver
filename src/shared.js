import { setsAreEqual, oneOf, strAfter, padLeft, parseQuery } from "./utils.js";

export const DEFAULT_COOKIE_STORE_ID = "firefox-default";
export const PRIVATE_COOKIE_STORE_ID = "firefox-private";

const storageListeners = [];
const storageBeforeListeners = [];

async function processListeners(listeners, key, value, blocking = false) {
  let failedcbs = [];
  for (let cb of listeners) {
    try {
      if (blocking) {
        await cb(key, value);
      } else {
        cb(key, value);
      }
    } catch (e) {
      if (e.message === "can't access dead object") {
        failedcbs.push(cb);
      } else {
        throw e;
      }
    }
  }
  for (let fcb of failedcbs) {
    listeners.splice(listeners.indexOf(fcb), 1);
  }
}

export const storage = {
  async get(key, def = null) {
    const req = await browser.storage.local.get(key);
    if (!(key in req)) return def;
    return req[key];
  },
  async set(key, value) {
    await processListeners(storageBeforeListeners, key, value, true);
    await browser.storage.local.set({ [key]: value });
    await processListeners(storageListeners, key, value, false);
  },
  subscribeBefore(fn) {
    storageBeforeListeners.push(fn);
  },
  subscribe(fn) {
    storageListeners.push(fn);
  },
};

const settingsDefault = {
  includePinned: true,
  showFavicons: false,
  showTitles: false,
  showCount: false,
  showWindows: true,
  openInNewTab: true,
  /**
   * Expand window TabSets
   * 0 - no
   * 1 - current
   * 2 - all
   */
  expandWindows: 1,
  /**
   * Place created Tab
   * 0 - start
   * 1 - end
   * 2 - after current tab
   */
  placeCreatedTabs: 1,
  overlayPosition: "right",
  /**
   * Lookup strategy when opening existing tab
   * 0 - nowhere
   * 1 - current
   * 2 - all
   */
  tabLookup: 1,
  useHistory: true,
  numberOfHistoryStates: 15,
  theme: "light",
};
const settingsKeys = Object.keys(settingsDefault);
const settingsListeners = [];

export const settings = {
  get(key) {
    if (settingsKeys.indexOf(key) === -1)
      throw new Error(`Unknown Preferences key: ${key}`);
    return storage.get(`settings:${key}`, settingsDefault[key]);
  },
  async getAll() {
    let rsettings = (
      await Promise.all(
        settingsKeys.map((x) => settings.get(x).then((setting) => [x, setting]))
      )
    ).reduce((c, [key, value]) => {
      if (value !== null) c[key] = value;
      return c;
    }, {});
    return Object.assign({}, settingsDefault, rsettings);
  },
  async set(key, value) {
    await storage.set(`settings:${key}`, value);
    await processListeners(settingsListeners, key, value, false);
  },
  subscribe(fn) {
    settingsListeners.push(fn);
  },
};

export function isURLPrivileged(url) {
  if (url === "about:blank") return false;
  if (url === "about:home") return false;
  if (/^(chrome|javascript|data|file|about)\:/.test(url)) return true;
  return false;
}

export function getMangledURL(url) {
  if (isURLPrivileged(url))
    return `/dist/handler.html?url=${encodeURIComponent(url)}`;
  return url;
}

export function getUnmangledURL(url) {
  if (url.indexOf(browser.runtime.getURL("/dist/handler.html")) === 0) {
    const qu = parseQuery("?" + strAfter(url, "handler.html?"));
    return qu.url;
  }
  return url;
}

export function tabSetsAreEqual(setA, setB) {
  setA = setA.filter((x) => {
    return !oneOf(x, "", "about:blank", "about:newtab");
  });
  setB = setB.filter((x) => {
    return !oneOf(x, "", "about:blank", "about:newtab");
  });
  return setsAreEqual(setA, setB);
}

export async function openURL(
  url,
  cookieStoreId = DEFAULT_COOKIE_STORE_ID,
  newTab = true
) {
  const currentTabs = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (
    currentTabs.length === 0 ||
    currentTabs[0] === browser.tabs.TAB_ID_NONE ||
    currentTabs[0].cookieStoreId !== cookieStoreId
  )
    newTab = true;
  try {
    const lookup = await settings.get("tabLookup");
    if (lookup !== 0) {
      const query = lookup === 1 ? { currentWindow: true } : {};
      const tabs = await browser.tabs.query(query);
      for (let tab of tabs) {
        if (tab.cookieStoreId === cookieStoreId && tab.url === url)
          return await Promise.all([
            browser.tabs.update(tab.id, { active: true }),
            browser.windows.update(tab.windowId, { focused: true }),
          ]);
      }
    }
    if (newTab) {
      return await browser.tabs.create({
        url: getMangledURL(url),
        cookieStoreId,
      });
    }
    return await browser.tabs.update({
      url: getMangledURL(url),
    });
  } catch (e) {
    if (e.message.substr(0, 27) === "No cookie store exists with") {
      return await browser.tabs.create({
        url: getMangledURL(url),
        cookieStoreId: DEFAULT_COOKIE_STORE_ID,
      });
    } else if (e.message === "Illegal to set non-private cookieStoreId in a private window") {
      return await browser.tabs.create({
        url: getMangledURL(url),
        cookieStoreId: PRIVATE_COOKIE_STORE_ID,
      });
    } else {
      throw e;
    }
  }
}

export function getDefaultTabSetName() {
  const date = new Date();
  const pl = padLeft.bind(null, 2, "0");
  return `${date.getFullYear()}-${pl(date.getMonth() + 1)}-${pl(
    date.getDate()
  )} ${pl(date.getHours())}:${pl(date.getMinutes())}`;
}
