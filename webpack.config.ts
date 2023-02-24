import * as webpack from "webpack";
import path = require("path");
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
import ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
import MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = (env: any) => {
  const dir = (file: string) => path.resolve(__dirname, file);

  return {
    entry: {
      content: dir("./source/content"),
      main: dir("./source/content/index"),
      styles: dir("./source/styles.scss"),
    },
    output: {
      path: dir("./dist"),
      filename: "[name].js",
    },
    devtool: "source-map",
    resolve: {
      extensions: [".ts", ".js"],
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          rules: [{ loader: "style-loader" }, { loader: "css-loader" }],
        },
        {
          test: /\.scss$/,
          use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
        },
        {
          test: /\.(jpe?g|png|gif|eot|ttf|svg|woff|woff2|md)$/i,
          type: "asset/resource",
          dependency: { not: ["url"] },
        },
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          loader: "ts-loader",
          options: { transpileOnly: true },
        },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin(),
      new CleanWebpackPlugin(),
      new webpack.EnvironmentPlugin(),
      new ForkTsCheckerWebpackPlugin(),
      new CleanWebpackPlugin(),
      ...[
        new MonacoWebpackPlugin({
          languages: ["markdown"],
        }),
      ],
    ],
  } as webpack.Configuration;
};
