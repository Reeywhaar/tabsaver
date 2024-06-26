import { processListeners } from "../utils";

export class Storage {
  storageListeners = [];
  storageBeforeListeners = [];

  async get(key, def = null) {
    const req = await browser.storage.local.get(key);
    if (!(key in req)) return def;
    return req[key];
  }

  async set(key, value) {
    await processListeners(this.storageBeforeListeners, key, value, true);
    await browser.storage.local.set({ [key]: value });
    await processListeners(this.storageListeners, key, value, false);
  }

  subscribeBefore(fn) {
    this.storageBeforeListeners.push(fn);
  }

  subscribe(fn) {
    this.storageListeners.push(fn);
  }
}
