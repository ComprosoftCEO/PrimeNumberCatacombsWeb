const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  entry: './src/index.ts',
  devtool: 'inline-source-map',
  mode: 'development',
  devServer: {
    contentBase: './build',
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: 'Prime Number Catacombs',
      template: 'src/index.html',
      favicon: 'assets/catacombs.png',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.js$/,
        use: ['source-map-loader'],
        enforce: 'pre',
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(gltf|glb)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(wav|mp3|ogg)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.lvl$/i,
        type: 'asset/source',
      },
      {
        test: /\.json$/i,
        type: 'asset/resource',
      },
      {
        test: /\.ttf$/i,
        type: 'asset/resource',
      },
    ],
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
  experiments: {
    asyncWebAssembly: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      engine: path.resolve(__dirname, 'src/engine'),
      areas: path.resolve(__dirname, 'src/areas'),
      entities: path.resolve(__dirname, 'src/entities'),
      resources: path.resolve(__dirname, 'src/resources'),
      assets: path.resolve(__dirname, 'assets/'),
    },
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'build'),
    publicPath: '/',
  },
};
