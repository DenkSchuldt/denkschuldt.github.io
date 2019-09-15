const path = require("path");
const webpack = require("webpack");
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");

const VERSION = require('./version');

const PATHS = {
  app: path.join(__dirname, "assets"),
  build: path.join(__dirname, "dist")
}

module.exports = {
  context: PATHS.app,
  mode: 'production',
  entry: path.join(PATHS.app, "src/index.js"),
  output: {
    path: PATHS.build,
    filename: `denk.${VERSION}.js`
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env', 'react'],
            plugins: [
              'babel-plugin-transform-object-rest-spread',
              'babel-plugin-transform-class-properties'
            ]
          }
        }
      },
      {
        test: /\.css$/,
        exclude: /node_modules/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              plugins: () => [require('autoprefixer')]
            }
          }
        ]
      },
      {
        test: /\.(svg|jpg)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "url-loader"
          }
        ]
      }
    ]
  },
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        exclude: [/\.min\.js$/gi]
      }),
      new OptimizeCSSAssetsPlugin({})
    ]
  },
  stats: {
    warnings: false
  }
};
