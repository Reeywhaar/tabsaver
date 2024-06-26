import { processListeners } from "../utils";

export class Settings {
  storage;

  settingsKeys = Object.keys(settingsDefault);
  settingsListeners = [];

  get(key) {
    if (this.settingsKeys.indexOf(key) === -1)
      throw new Error(`Unknown Preferences key: ${key}`);
    return this.storage.get(`settings:${key}`, settingsDefault[key]);
  }

  async getAll() {
    let rsettings = (
      await Promise.all(
        this.settingsKeys.map((x) =>
          this.get(x).then((setting) => [x, setting])
        )
      )
    ).reduce((c, [key, value]) => {
      if (value !== null) c[key] = value;
      return c;
    }, {});
    return Object.assign({}, settingsDefault, rsettings);
  }

  async set(key, value) {
    await this.storage.set(`settings:${key}`, value);
    await processListeners(this.settingsListeners, key, value, false);
  }

  subscribe(fn) {
    this.settingsListeners.push(fn);
  }
}

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
  /**
   * Lookup strategy when opening existing tab
   * 0 - nowhere
   * 1 - current
   * 2 - all
   */
  tabLookup: 1,
  useHistory: true,
  numberOfHistoryStates: 15,
};
