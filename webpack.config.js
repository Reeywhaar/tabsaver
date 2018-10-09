const path = require("path");
const webpack = require("webpack");
const InertEntryPlugin = require("inert-entry-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const extractSVG = new ExtractTextPlugin("[name]");
const VueLoaderPlugin = require("vue-loader/lib/plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

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
				path: path.resolve(__dirname, "ext/dist"),
				filename: "[name].js",
				publicPath: "/dist/",
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
				...[
					{
						name: "panel",
						chunks: ["panel"],
					},
					{
						name: "sidebar",
						chunks: ["panel"],
					},
					{
						name: "options",
						chunks: ["options"],
					},
					{
						name: "background",
						chunks: ["background"],
					},
					{
						name: "handler",
						chunks: ["handler"],
					},
				].map(item => {
					return new HtmlWebpackPlugin({
						chunks: item.chunks,
						filename: `${item.name}.html`,
						title: `TabSaver ${item.name}`,
						template: `html_templates/${item.name}.html`,
					});
				}),
			],
			optimization: {
				minimize: args.mode !== "development",
				splitChunks: {
					chunks: "all",
				},
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
