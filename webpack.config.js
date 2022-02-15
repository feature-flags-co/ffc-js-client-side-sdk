const path = require('path');
const package = require('./package.json');

const baseConfig = {
  entry: {
    'ffc-sdk': './src/umd.ts'
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
    filename: `[name]-${package.version}.js`,
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

const configWithVersion = {
  ...baseConfig, output: {
    path: path.resolve(__dirname, 'umd'),
    filename: `[name]-${package.version}.js`,
    libraryTarget: 'umd',
    umdNamedDefine: true,
    // prevent error: `Uncaught ReferenceError: self is not define`
    globalObject: 'this',
  }
};

const configWithoutVersion = {
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
  configWithVersion,
  configWithoutVersion
];