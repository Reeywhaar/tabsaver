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
			<div class="history-options indent-1" :class="{'disabled': !useHistory}">
				<div class="options__section">
					<label>Number of history states <input class="options__states-counter" type="number" name="choices" min="1" max="100" v-model.number="numberOfHistoryStates"/></label>
				</div>
				<div class="history-options__states-count">States count: {{statesCount}}</div>
				<div class="comment">* Lot of states may abuse your hard drive, especially if you have a lot TabSets with a lot of tabs in them.</div>
				<div class="comment">Value between 10 and 30 is optimal</div>
			</div>
		</div>
		<div class="options__section">
			<hold-button class="button clear-tabsets-button" color="hsla(10, 90%, 50%)" delay="2" @click="clearTabsets">Clear TabSets</hold-button>
		</div>
		<div class="options__section credits">
			<h3>Credits</h3>
			<p>This project takes best of these products:</p>
			<ul class="credits-list">
				<li class="credits-list__item"><a href="https://vuejs.org/"><strong>Vue.js</strong></a> reactive framework</li>
				<li class="credits-list__item"><a href="https://github.com/flitbit/diff"><strong>deep-diff</strong></a> library</li>
			</ul>
		</div>
	</div>
</template>
<script>
import HoldButton from "./hold-button.vue";
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
		HoldButton,
	},
	computed: {
		includePinned: createProperty("includePinned"),
		showFavicons: createProperty("showFavicons"),
		showTitles: createProperty("showTitles"),
		useHistory: createProperty("useHistory"),
		numberOfHistoryStates: createProperty("numberOfHistoryStates"),
		theme: createProperty("theme"),
		overlayPosition: createProperty("overlayPosition"),
		statesCount() {
			return this.$store.state.statesCount;
		},
	},
	methods: {
		clearTabsets() {
			this.$store.dispatch("clearTabsets");
		},
	},
};
</script>
