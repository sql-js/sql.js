const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    sqleet: './src/worker/index.ts',
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader?configFile=tsconfig.worker.json',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'var',
    library: '[name]'
  }
};
