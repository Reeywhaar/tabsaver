import { storage, settings } from "../shared.js";
import { debounce } from "../utils.js";

export class History {
  async permittedNumberOfStates() {
    const [use, length] = await Promise.all([
      settings.get("useHistory"),
      settings.get("numberOfHistoryStates"),
    ]);
    if (!use) return 0;
    return length;
  }

  getAll() {
    return storage.get("history:states", []);
  }

  async last() {
    const states = await storage.get("history:states", []);
    if (states.length === 0) return null;
    return states[states.length - 1];
  }

  async pop() {
    const states = await storage.get("history:states", []);
    if (states.length === 0) return null;
    const last = states.pop();
    await Promise.all([
      storage.set("history:states", states),
      storage.set("history:count", states.length),
    ]);
    return last;
  }

  async clear() {
    Promise.all([
      storage.set("history:states", []),
      storage.set("history:count", 0),
    ]);
  }

  push = debounce(async (state, callback = () => {}) => {
    if (!state) return;
    let capacity = await this.permittedNumberOfStates();
    if (capacity === 0) return;
    let states = await this.getAll();
    states = states.slice(states.length - (capacity - 1), states.length);
    states.push(state);
    await Promise.all([
      storage.set("history:states", states),
      storage.set("history:count", states.length),
    ]);
    callback();
  }, 1000);

  async count() {
    return await storage.get("history:count", 0);
  }
}
