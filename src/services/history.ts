import { debounce } from "../utils";
import { Settings } from "./settings";
import { Storage } from "./storage";

type HistoryState = {};

export class History {
  storage!: Storage;
  settings!: Settings;

  async permittedNumberOfStates() {
    const [use, length] = await Promise.all([
      this.settings.get("useHistory"),
      this.settings.get("numberOfHistoryStates"),
    ]);
    if (!use) return 0;
    return length ?? 0;
  }

  async getAll() {
    return await this.storage.get<HistoryState[]>("history:states", []);
  }

  async last() {
    const states = await this.storage.get<HistoryState[]>("history:states", []);
    return states.at(-1) ?? null;
  }

  async pop() {
    const states = await this.storage.get<HistoryState[]>("history:states", []);
    if (states.length === 0) return null;
    const last = states.pop();
    await Promise.all([
      this.storage.set("history:states", states),
      this.storage.set("history:count", states.length),
    ]);
    return last;
  }

  async clear() {
    Promise.all([
      this.storage.set("history:states", []),
      this.storage.set("history:count", 0),
    ]);
  }

  push = debounce(async (state: HistoryState, callback = () => {}) => {
    if (!state) return;
    let capacity = await this.permittedNumberOfStates();
    if (capacity === 0) return;
    let states = await this.getAll();
    states = states.slice(states.length - (capacity - 1), states.length);
    states.push(state);
    await Promise.all([
      this.storage.set("history:states", states),
      this.storage.set("history:count", states.length),
    ]);
    callback();
  }, 1000);

  async count() {
    return await this.storage.get("history:count", 0);
  }
}
