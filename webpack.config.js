const path = require('path');
const package = require('./package.json');

const baseConfig = {
  entry: {
    [`ffc-sdk-${package.version}`]: './src/umd.ts',
    [`ffc-sdk`]: './src/umd.ts'
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
    filename: `[name].js`,
    libraryTarget: 'umd',
    //library: 'FFCJsClient',
    umdNamedDefine: true,
    // prevent error: `Uncaught ReferenceError: self is not define`
    globalObject: 'this',
  },
  optimization: {
    minimize: true
  },
};

const config = {
  ...baseConfig, output: {
    path: path.resolve(__dirname, 'umd'),
    filename: `[name].js`,
    libraryTarget: 'umd',
    umdNamedDefine: true,
    // prevent error: `Uncaught ReferenceError: self is not define`
    globalObject: 'this',
  }
};

module.exports = [
  config
];