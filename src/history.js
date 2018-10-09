import { storage, settings } from "./shared.js";
import { debounce } from "./utils.js";

export const History = {
	async permittedNumberOfStates() {
		const [use, length] = await Promise.all([
			settings.get("useHistory"),
			settings.get("numberOfHistoryStates"),
		]);
		if (!use) return 0;
		return length;
	},
	getAll() {
		return storage.get("history:states", []);
	},
	async last() {
		const states = await storage.get("history:states", []);
		if (states.length === 0) return null;
		return states[states.length - 1];
	},
	async clear() {
		storage.set("history:states", []);
	},
	push: debounce(async state => {
		let capacity = await History.permittedNumberOfStates();
		if (capacity === 0) return;
		const states = await History.getAll();
		if (states.length > capacity - 1) {
			const overflow = states.length - (capacity - 1);
			states.splice(0, overflow);
		}
		states.push(state);
		return storage.set("history:states", states);
	}, 1000),
	async count() {
		const states = await storage.get("history:states", []);
		return states.length;
	},
};
