const path = require('path');

module.exports = {
  // EMFLAGS_OPTIMIZED ("--closure 1") already managing optimizations in Makefile
  mode: 'production',
  entry: './src/database/index.ts',
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader?configFile=tsconfig.json',
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
