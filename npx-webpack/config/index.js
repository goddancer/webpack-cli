/*
 * 参考，无用
 * */
const path = require('path').posix,
  packageJson = require('../package.json'),
  version = packageJson.version,
  prdName = packageJson.productName,
  isDev = process.env.NODE_ENV === 'development'

let configs = {
  production: {
    urlBasePath: '/membership/',
    jsFileName: path.join(version, prdName, '[name].js'),
    cssFileName: path.join(version, prdName, '[name].css'),
    htmlFileName: path.join(version, prdName, 'index.html'),
    assetFileName: path.join(version, prdName, 'img', '[name]_[hash:7].[ext]'),
  },
  development: {
    urlBasePath: '/',
    jsFileName: 'app.js',

    // for wm and brokerage product line
    htmlFileName: key => `${key}/v2/membership/index.html`,

    //htmlFileName: path.join('projectname', 'index.html'),
    assetFileName: path.join('img', '[name]_[hash:7].[ext]'),
    port: 80,
  },
}

module.exports = isDev ? configs.development : configs.production
