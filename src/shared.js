import { strAfter, parseQuery } from "./utils.js";

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
  if (url.startsWith(browser.runtime.getURL("/dist/handler.html"))) {
    return parseQuery("?" + strAfter(url, "handler.html?")).url;
  }
  return url;
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
    } else if (
      e.message ===
      "Illegal to set non-private cookieStoreId in a private window"
    ) {
      return await browser.tabs.create({
        url: getMangledURL(url),
        cookieStoreId: PRIVATE_COOKIE_STORE_ID,
      });
    } else {
      throw e;
    }
  }
}

export const DEFAULT_COOKIE_STORE_ID = "firefox-default";
export const PRIVATE_COOKIE_STORE_ID = "firefox-private";
