<template>
	<div class="options">
		<div class="options__section">
			<label><input class="options__left-checkbox" type="checkbox" v-model="includePinned">Include pinned tabs when saving TabSet</label>
		</div>
		<div class="options__section">
			<label><input class="options__left-checkbox" type="checkbox" v-model="showFavicons">Show tabs' favicons</label>
			<div class="comment indent-1">* favicons caching is not implemented yet, which results in multiple requests while rendering TabSet tab. Also may be a privacy concern</div>
		</div>
		<div class="options__section">
			<label><input class="options__left-checkbox" type="checkbox" v-model="showTitles">Show tabs' titles</label>
		</div>
		<div class="options__section">
			<span>Theme&ensp;</span><select class="browser-style" v-model="theme">
				<option value="light">Light</option>
				<option value="dark">Dark</option>
				<option value="daytime">Based on day time</option>
			</select>
			<div class="comment">* Day time based theme is light from 7am to 8pm, otherwise it's dark</div>
		</div>
		<div class="options__section">
			<span>Show controls overlay at&ensp;</span><select class="browser-style" v-model="overlayPosition">
				<option value="right">Right</option>
				<option value="left">Left</option>
			</select>
		</div>
		<div class="options__section">
			<label><input class="options__left-checkbox" type="checkbox" v-model="useHistory"/>Use history</label>
			<div class="options__section indent-1" :class="{'disabled': !useHistory}">
				<label>Number of history states <input class="options__states-counter" type="number" name="choices" min="2" max="100" v-model="numberOfHistoryStates"/></label>
			</div>
		</div>
	</div>
</template>
<script>
import ToggleButtonComponent from "./toggle-button.vue";
import { sleep, oneOf, first } from "../utils.js";

function createProperty(prop) {
	return {
		get() {
			return this.$store.state.settings[prop];
		},
		set(value) {
			this.$store.dispatch("setSetting", {
				key: prop,
				value,
			});
		},
	};
}

export default {
	components: {
		toggleButton: ToggleButtonComponent,
	},
	computed: {
		includePinned: createProperty("includePinned"),
		showFavicons: createProperty("showFavicons"),
		showTitles: createProperty("showTitles"),
		useHistory: createProperty("useHistory"),
		numberOfHistoryStates: createProperty("numberOfHistoryStates"),
		theme: createProperty("theme"),
		overlayPosition: createProperty("overlayPosition"),
	},
};
</script>
