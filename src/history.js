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
	async pop() {
		const states = await storage.get("history:states", []);
		if (states.length === 0) return null;
		const last = states.pop();
		await Promise.all([
			storage.set("history:states", states),
			storage.set("history:count", states.length),
		]);
		return last;
	},
	async clear() {
		Promise.all([
			storage.set("history:states", []),
			storage.set("history:count", 0),
		]);
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
		await Promise.all([
			storage.set("history:states", states),
			storage.set("history:count", states.length),
		]);
	}, 500),
	async count() {
		return await storage.get("history:count", 0);
	},
};
