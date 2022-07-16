const path = require("path");
const webpack = require("webpack");
const VueLoaderPlugin = require("vue-loader/lib/plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const SvgMakerPlugin = require("@reeywhaar/svgmaker/webpack-plugin.js");

// Handle docker's SIGINT
process.on("SIGINT", () => {
  console.log(`\nGot "SIGINT", exiting...`);
  process.exit(0);
});

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
          "process.env.NODE_ENV": JSON.stringify(args.mode ?? "production"),
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
        ].map((item) => {
          return new HtmlWebpackPlugin({
            chunks: item.chunks,
            filename: `${item.name}.html`,
            title: `TabSaver ${item.name}`,
            template: `html_templates/${item.name}.html`,
          });
        }),
        ...["./icon.svg.js", "./icon-light.svg.js"].map(
          (file) => new SvgMakerPlugin({ file, output: "../icons" })
        ),
      ],
      optimization: {
        minimize: args.mode !== "development",
        splitChunks: {
          chunks: "all",
        },
      },
      devtool: false,
    },
  ];
};
