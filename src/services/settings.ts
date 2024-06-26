import { processListeners } from "../utils";
import { Storage } from "./storage";

export type SettingsDescriptor = {
  includePinned: boolean;
  showFavicons: boolean;
  showTitles: boolean;
  showCount: boolean;
  showWindows: boolean;
  openInNewTab: boolean;
  /**
   * Expand window TabSets
   * 0 - no
   * 1 - current
   * 2 - all
   */
  expandWindows: 0 | 1 | 2;
  /**
   * Place created Tab
   * 0 - start
   * 1 - end
   * 2 - after current tab
   */
  placeCreatedTabs: 0 | 1 | 2;
  /**
   * Lookup strategy when opening existing tab
   * 0 - nowhere
   * 1 - current
   * 2 - all
   */
  tabLookup: 0 | 1 | 2;
  useHistory: boolean;
  numberOfHistoryStates: number;
};

export class Settings {
  storage!: Storage;

  private settingsKeys = Object.keys(
    settingsDefault
  ) as (keyof SettingsDescriptor)[];
  private settingsListeners: ((key: string, value: any) => unknown)[] = [];

  get<K extends keyof SettingsDescriptor>(
    key: K
  ): Promise<SettingsDescriptor[K] | null> {
    if (this.settingsKeys.indexOf(key) === -1)
      throw new Error(`Unknown Preferences key: ${key}`);
    return this.storage.get(`settings:${key}`, settingsDefault[key]);
  }

  async getAll(): Promise<SettingsDescriptor> {
    let rsettings = (
      await Promise.all(
        this.settingsKeys.map((x) =>
          this.get(x).then((setting) => [x, setting])
        )
      )
    ).reduce((c, [key, value]) => {
      if (value !== null) (c as any)[key as string] = value;
      return c;
    }, {});
    return Object.assign({}, settingsDefault, rsettings);
  }

  async set<K extends keyof SettingsDescriptor>(
    key: K,
    value: SettingsDescriptor[K]
  ) {
    await this.storage.set(`settings:${key}`, value);
    await processListeners(this.settingsListeners, key, value, false);
  }

  subscribe(fn: (key: string, value: any) => unknown) {
    this.settingsListeners.push(fn);
  }
}

const settingsDefault: SettingsDescriptor = {
  includePinned: true,
  showFavicons: false,
  showTitles: false,
  showCount: false,
  showWindows: true,
  openInNewTab: true,
  expandWindows: 1,
  placeCreatedTabs: 1,
  tabLookup: 1,
  useHistory: true,
  numberOfHistoryStates: 15,
};
