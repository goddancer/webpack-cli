// Utilities
const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')

// Plugins
const OpenBrowserPlugin = require('open-browser-webpack-plugin')

// Configs
const baseWebpackConfig = require('./webpack.base.conf')()

module.exports = () => {
  let config = merge(baseWebpackConfig, {
    mode: 'development',
    plugins: [
      // 模块热替换
      new webpack.HotModuleReplacementPlugin(),
      // 打开浏览器
      new OpenBrowserPlugin({
        url: 'http://localhost:3000',
      }),
    ],
  })

  // add hot-reload related code to entry chunks
  // 这里的思想是：在每个需要热刷新的entry之前都要添加监听器。这里只有一个entry，所以这么写。
  config.entry.unshift('./scripts/dev-client')

  return config
}
