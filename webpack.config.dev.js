const path = require("path");
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const VERSION = require('./version');

const PATHS = {
  app: path.join(__dirname, "assets"),
  build: path.join(__dirname, "dist")
}

module.exports = {
  context: PATHS.app,
  entry: path.join(PATHS.app, "src/index.js"),
  output: {
    path: PATHS.build,
    filename: `denk.${VERSION}.js`
  },
  mode: 'development',
  devtool: 'inline-source-map', // Source map
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
              'babel-plugin-transform-class-properties',
              'babel-plugin-transform-object-rest-spread'
            ]
          }
        }
      },
      {
        test: /\.css$/, // -> Permite usar import './style.css'
        exclude: /node_modules/,
        use: [
          MiniCssExtractPlugin.loader,
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
        test: /\.svg$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "url-loader" // Permite usar DataURL
          }
        ]
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: path.join(`denk.${VERSION}.css`)
    }),
    //new webpack.HotModuleReplacementPlugin()
  ],
  stats: {
    warnings: false
  },
  devServer: {
    publicPath: '/dist/',
    //hot: true
  }
};
