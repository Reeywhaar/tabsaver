import { Storage } from "./services/storage";
import { Settings } from "./services/settings";

declare global {
  interface Window {
    storage: Storage;
    settings: Settings;
  }
}
