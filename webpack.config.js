const path = require("path");
const webpack = require("webpack");

module.exports = {
	entry: {
		panel: './src/panel.js',
		background: "./src/background.js",
		handler: "./src/handler.js",
	},
	output: {
    path: path.resolve(__dirname, 'ext/js'),
    filename: '[name].js'
	},
	plugins: [
		new webpack.optimize.ModuleConcatenationPlugin()
	]
};
