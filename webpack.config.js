const path = require('path');

module.exports = {
  entry: {
    'ffc-sdk': './src/index.ts'
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    path: path.resolve(__dirname, 'umd'),
    filename: '[name].js',
    libraryTarget: 'umd',
    //library: 'FFCJsClient',
    umdNamedDefine: true,
    // prevent error: `Uncaught ReferenceError: self is not define`
    globalObject: 'this',
  },
};
