import { processListeners } from "../utils";

type Listener = (key: string, value: any) => unknown;

export class Storage {
  storageListeners: Listener[] = [];
  storageBeforeListeners: Listener[] = [];

  async get<T = any>(key: string, def: T) {
    const req = await browser.storage.local.get(key);
    if (!(key in req)) return def;
    return req[key] as T;
  }

  async set<T>(key: string, value: T) {
    await processListeners(this.storageBeforeListeners, key, value, true);
    await browser.storage.local.set({ [key]: value });
    await processListeners(this.storageListeners, key, value, false);
  }

  subscribeBefore(fn: Listener) {
    this.storageBeforeListeners.push(fn);
  }

  subscribe(fn: Listener) {
    this.storageListeners.push(fn);
  }
}
