const path = require("path");
const webpack = require("webpack");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const InertEntryPlugin = require('inert-entry-webpack-plugin');
const extractSVG = new ExtractTextPlugin("[name]");


module.exports = [
	{
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
	},
	{
		entry: {
			"icon.svg": "./icon.svg.js",
		},
		output: {
			path: path.resolve(__dirname, 'ext/icons'),
			filename: '[name]'
		},
		resolveLoader: {
			alias: {
				'svg-js-loader': path.join(__dirname, 'utils', 'svg-js-loader.js')
			}
		},
		module: {
			rules: [
				{
					test: /\.svg\.js$/,
					use: extractSVG.extract({
						use: "svg-js-loader"
					}),
				},
			]
		},
		plugins: [
			extractSVG,
			new InertEntryPlugin()
		]
	}
];
