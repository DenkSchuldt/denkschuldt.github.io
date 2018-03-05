
const path = require("path");
const webpack = require("webpack");
const ExtractTextPlugin = require("extract-text-webpack-plugin");

const PATHS = {
  app: path.join(__dirname, "assets"),
  build: path.join(__dirname, "dist")
}

module.exports = {
  context: PATHS.app,
  entry: path.join(PATHS.app, "src/index.js"),
  output: {
      path: PATHS.build,
      filename: `js/bundle.v1.2.3.js`
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: [
          { loader: 'babel-loader',
            options: {
              presets: ['env', 'react', 'preact']
            }
          }
        ]
      },
      {
        test: /\.scss$/,
        use: [
          { loader: "style-loader" },
          { loader: "css-loader" },
          { loader: "sass-loader" }
        ]
      },
      {
        test: /\.(gif|png|jpe?g|svg)$/i,
        use: [
          { loader: "file-loader" },
          { loader: 'image-webpack-loader',
            query: {
              progressive: true,
              optimizationLevel: 7,
              interlaced: false
            }
          }
        ]
      },
      {
       test: /\.json$/,
       use: [
         { loader: 'json-loader' }
       ]
      }
    ]
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin()
  ],
  stats: {
    warnings: false
  },
  resolve: {
    alias: {
      'react': 'preact-compat',
      'react-dom': 'preact-compat'
    }
  }
};
