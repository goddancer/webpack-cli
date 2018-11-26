// Utilities
const express = require('express')
const webpack = require('webpack')

// Configs
const webpackConfig = require('../build/webpack.dev.conf.js')()
const port = 3000

const app = express()
const compiler = webpack(webpackConfig)

// Middleware Definition
const devMiddleware = require('webpack-dev-middleware')(compiler, {
    publicPath: webpackConfig.output.publicPath,
    stats: {
        colors: true,
        chunks: false,
    },
})

const hotMiddleware = require('webpack-hot-middleware')(compiler)

compiler.hooks.compilation.tap('MyHtmlWebPackHotReload', compilation => {
    compilation.hooks.htmlWebpackPluginAfterEmit.intercept({
        call: () => {
            console.log(111111111)
            // eventEmitter.emit('reload')
            hotMiddleware.publish({ action: 'reload' })
        },
    })
})

app.use(devMiddleware)
app.use(hotMiddleware)

module.exports = app.listen(port, function(err) {
    if (err) {
        console.log(err)
        return
    }

    console.log('http://localhost:' + port + '\n')
})
