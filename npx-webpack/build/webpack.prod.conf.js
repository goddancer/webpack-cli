// Utilities
const path = require('path');
const merge = require('webpack-merge')

// Configs
const baseWebpackConfig = require('./webpack.base.conf')()

module.exports = merge(baseWebpackConfig, {
    entry: [],               // 入口文件
    output: {},              // 出口文件
    module: {},              // 处理对应模块
    plugins: [],             // 对应的插件
    devServer: {},           // 开发服务器配置
    mode: 'production',      // 模式配置
})