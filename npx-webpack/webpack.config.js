// Node 8.2+ 版本提供的 npx 命令  npx webpack
// 会以项目根目录下的webpack.config.js为默认配置，执行
// 压缩
const uglify = require('uglifyjs-webpack-plugin')

// Utilities
const path = require('path')
const merge = require('webpack-merge')

// Plugins
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')

// Configs
const baseWebpackConfig = require('./build/webpack.base.conf')()
delete baseWebpackConfig.entry

module.exports = merge(baseWebpackConfig, {
  context: __dirname,
  watch: false,
  watchOptions: {
    aggregateTimeout: 300,
    poll: 10000,
    ignored: /node_modules/, // ignored: "files/**/*.js"
  },
  entry: ['./test/main.js'], // 入口文件
  output: {
    filename: 'app.[hash:5].js',
    path: path.resolve('test/dist'),
  }, // 出口文件
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
    /*new uglify({
      extractComments: true
    }),*/
  ], // 对应的插件
  devServer: {}, // 开发服务器配置
  // mode: 'production', // 模式配置
  mode: 'development', // 模式配置
})
