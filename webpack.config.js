const path = require("path");
const webpack = require("webpack");
const InertEntryPlugin = require("inert-entry-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const extractSVG = new ExtractTextPlugin("[name]");
const VueLoaderPlugin = require("vue-loader/lib/plugin");
module.exports = (h, args) => {
	return [
		{
			entry: {
				panel: "./src/panel.js",
				options: "./src/options.js",
				background: "./src/background.js",
				handler: "./src/handler.js",
			},
			output: {
				path: path.resolve(__dirname, "ext/js"),
				filename: "[name].js",
			},
			module: {
				rules: [
					{
						test: /\.vue$/,
						use: "vue-loader",
					},
				],
			},
			plugins: [
				new VueLoaderPlugin(),
				new webpack.optimize.ModuleConcatenationPlugin(),
				new webpack.DefinePlugin({
					"process.env": {
						NODE_ENV: '"production"',
					},
				}),
			],
			optimization: {
				minimize: args.mode !== "development",
			},
			devtool: false,
		},
		{
			entry: {
				"icon.svg": "./icon.svg.js",
				"icon-light.svg": "./icon-light.svg.js",
			},
			output: {
				path: path.resolve(__dirname, "ext/icons"),
				filename: "[name]",
			},
			resolveLoader: {
				alias: {
					"svg-js-loader": "@reeywhaar/svgmaker/loader.js",
				},
			},
			module: {
				rules: [
					{
						test: /\.svg\.js$/,
						use: extractSVG.extract({
							use: ["svg-js-loader"],
						}),
					},
				],
			},
			plugins: [extractSVG, new InertEntryPlugin()],
		},
	];
};
