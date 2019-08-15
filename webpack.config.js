const path = require('path');

module.exports = {
  // EMFLAGS_OPTIMIZED ("--closure 1") already managing optimizations in Makefile
  mode: 'development',
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  output: {
    filename: 'api.js',
    path: path.resolve(__dirname, 'out')
  }
};
