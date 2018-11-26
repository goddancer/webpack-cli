// Node 8.2+ 版本提供的 npx 命令  npx webpack
// 会以项目根目录下的webpack.config.js为默认配置，执行
// 压缩
const uglify = require('uglifyjs-webpack-plugin');

const config = {
    context: __dirname,
    watch: false,
    watchOptions: {
        aggregateTimeout: 300,
        poll: 10000,
        ignored: /node_modules/, // ignored: "files/**/*.js"
    },
    entry: './src/zjc/app.js',
    output: {
        filename: 'bundle.js',
        path: __dirname + '/dist/zjc/js'
    },
    plugins: [
        new uglify({
            extractComments: true
        }),
    ]
};

module.exports = config;