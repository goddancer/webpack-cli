var base64Img = require('base64-img'),
  favImg = base64Img.base64Sync(__dirname + '/../src/assets/favicon.ico')
;(configs = require('./index.js')),
  (pkg = require('../package.json')),
  (hasher = require('folder-hash'))

module.exports = function() {
  return new Promise((resolve, reject) => {
    hasher
      .hashElement(__dirname + '/../src/', {
        algo: 'md5',
        encoding: 'hex',
      })
      .then(function(hash) {
        resolve({
          'common-data': {
            URL_BASE_PATH: configs.urlBasePath,
            VERSION: pkg.version,
            PRD_NAME: pkg.productName,
            DEFAULT_TITLE: '积分中心',
            FAV_ICON_BASE64: favImg,
            SRC_HASH: hash.hash.substr(0, 10),
          },
        })
      })
  })
}
