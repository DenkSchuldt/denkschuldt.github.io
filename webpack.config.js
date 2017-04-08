
const path = require("path");
const ExtractTextPlugin = require("extract-text-webpack-plugin");

const PATHS = {
  app: path.join(__dirname, "assets"),
  build: path.join(__dirname, "assets")
}

module.exports = {
  context: PATHS.app,
  entry: path.join(PATHS.app, "src/index.js"),
  output: {
      path: PATHS.build,
      publicPath: "/assets/",
      filename: "js/bundle.js"
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel',
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'react']
        }
      },
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract('style', 'css!sass')
      },
      {
        test: /\.(jpg|png|svg)$/,
        loader: 'url-loader',
        options: {
          limit: 25000,
        },
      },
    ]
  },
  plugins: [
    new ExtractTextPlugin(path.join("css/[name].css"))
  ]
};
