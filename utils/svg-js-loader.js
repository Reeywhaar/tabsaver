const svgmaker = require("@reeywhaar/svgmaker");

module.exports = function SVGLoader(source) {
	if(this.cacheable) this.cacheable();
	if(this.resourcePath in require.cache){
		delete require.cache[this.resourcePath];
	}
	const svg = require(this.resourcePath).toString() + "\n";
	this.value = svg;
	return `module.exports = \`${svg}\``;
}