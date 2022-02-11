const path = require('path');
const { CodeRefsPlugin }  = require('ffc-code-refs-webpack-plugin');

module.exports = {
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
    filename: '[name].js',
    libraryTarget: 'umd',
    //library: 'FFCJsClient',
    umdNamedDefine: true,
    // prevent error: `Uncaught ReferenceError: self is not define`
    globalObject: 'this',
  },
  plugins: [
    new CodeRefsPlugin(),
  ],
  optimization: {
    minimize: true
  },
};
