// Utilities
const path = require('path');
const webpack = require('webpack')

// Plugins
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');// 拆分css样式的插件
const VueLoaderPlugin = require('vue-loader/lib/plugin')// vue-loader need VueLoaderPlugin

// Create multiple instances
const extractCSS = new ExtractTextPlugin({
    filename: 'reset.css',
});
const extractLESS = new ExtractTextPlugin('app.css');

module.exports = () => {
    let config = {
        entry: ['./src/main.js'],
        output: {
            // 添加hash可以防止文件缓存，每次都会生成4位的hash串
            filename: 'app.[hash:5].js',
            path: path.resolve('dist')
        },
        module: {
            rules: [
                {
                    test: /(src|common-module)\/.*\.js$/,
                    exclude: [
                        /src\/vendor\//,
                        /node_modules/,
                    ],
                    use: [
                        {
                            loader: 'babel-loader', // 这里安装bebel-loader@8.0.4会出问题
                        },
                    ],
                },
                {
                    test: /\.css$/,     // 解析reset.css
                    use: extractCSS.extract(['css-loader', 'postcss-loader'])
                },
                {
                    test: /\.less/,     // 解析样式
                    use: extractLESS.extract({
                        use: [
                            {
                                loader: 'css-loader',
                                options: {
                                    // If you are having trouble with urls not resolving add this setting.
                                    // See https://github.com/webpack-contrib/css-loader#url
                                    // url: true,
                                    minimize: true,
                                    // sourceMap: true,
                                    // outputPath: '../img'
                                }
                            },
                            'postcss-loader',
                            'less-loader'
                        ]
                    })
                },
                {
                    test: /\.(jpe?g|png|gif)$/,
                    use: [
                        {
                            loader: 'url-loader',
                            options: {
                                limit: 5000,
                                // outputPath: 'img/',   // 图片打包后存放的目录
                                name: 'img/[name][hash:5].[ext]'
                            }
                        },
                        'image-webpack-loader'
                    ]
                },
                {
                    test: /\.(htm)$/,
                    use: 'html-withimg-loader' // 处理htm中的img标签的路径问题
                },
                {
                    test: /\.(eot|ttf|woff|svg)$/,
                    use: 'file-loader' // 处理字体和svg图片
                },
                {
                    test: /\.vue/,
                    exclude: /(src\/vendor\/|node_modules)/,
                    loader: 'vue-loader',
                    options: {
                        autoprefixer: true,
                        loaders: {
                            js: 'babel-loader',
                        },
                    },
                },
            ]
        },
        plugins: [
            // vue-loader need VueLoaderPlugin
            new VueLoaderPlugin(),
            new HtmlWebpackPlugin({
                // 用哪个html作为模板
                // 在src目录下创建一个index.html页面当做模板来用
                template: './src/index.preprocess.htm',
                hash: true, // 会在打包好的bundle.js后面加上hash串
            }),
            // 拆分后会把css文件放到dist目录下
            extractCSS,
            extractLESS,
            // 通过postcss中的autoprefixer可以实现将CSS3中的一些需要兼容写法的属性添加响应的前缀
            require('autoprefixer'),
        ]
    }
    return config
}