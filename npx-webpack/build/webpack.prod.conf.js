// Utilities
const path = require('path')
const merge = require('webpack-merge')

// Plugins
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')

// Configs
const baseWebpackConfig = require('../config/index')()

module.exports = merge(baseWebpackConfig, {
  entry: [], // 入口文件
  output: {}, // 出口文件
  module: {}, // 处理对应模块
  plugins: [
    new OptimizeCssAssetsPlugin({
      assetNameRegExp: /\.css$/g,
      cssProcessor: require('cssnano'),
      cssProcessorPluginOptions: {
        preset: ['default', { discardComments: { removeAll: true } }],
      },
      canPrint: true,
    }),
  ], // 对应的插件
  devServer: {}, // 开发服务器配置
  mode: 'production', // 模式配置
})
