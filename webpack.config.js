const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: ['babel-polyfill', './src/index.js'],
  target: 'node',
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
      },
    ],
  },
  output: {
    path: './dist',
    filename: 'index.js',
    libraryTarget: 'umd',
  },
  externals: [nodeExternals()],
};
