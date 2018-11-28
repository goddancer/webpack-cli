const gulp = require('gulp');
const path = require('path');
const _ = require('lodash');
const webpack = require('webpack-stream');
const htmlWebpackPlugin = require('html-webpack-plugin');
const uglify = require('uglifyjs-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

Date.prototype.format = function(){
  const time = new Date();
  const year = time.getFullYear();
  const month = time.getMonth()+1;
  const day = time.getDay();
  const hour = time.getHours();
  const minute = time.getMinutes();
  const second = time.getSeconds();

  return ''+year+addZero(month)+addZero(day)+addZero(hour)+addZero(minute)+addZero(second);

  function addZero(time){
    if(time <= 9){
      return '0'+time;
    }else{
      return time;
    }
  }
};
module.exports = function(options){
  const taskOptions = _.extend({
    taskName: 'default',
    taskWatch: false,
    taskEntry: './test/demo/js/main.js',
    taskDist: './test/demo/dist/',
    taskOutput: {
      jsFilename: 'js/[name].js',
      cssFilename: 'css/[name].css',
      imgFilename: 'img/[name].[ext]',
      publicPath: './'
    },
    taskMinimize: {
      css: true,
      html: true,
      img: '20000',
      comments: true
    },
    taskTransUrl: false,
    taskHtmlWebpackPlugin: {
      filename: 'index.html',
      template: './test/demo/index.ejs',
      inject: false,
      title: 'this is awesome',
      publishTime: new Date().format()
    },
  }, options);
  gulp.task(taskOptions.taskName, function() {
    return gulp.src('src/entry.js')
      .pipe(webpack({
        watch: false,
        entry: {
          app: taskOptions.taskEntry,
        },
        output: {
          filename: taskOptions.taskOutput.jsFilename,
          publicPath: taskOptions.taskOutput.publicPath
        },
        module: {
          loaders: [
            {
              test: /\.css$/,
              include: [
                path.join(__dirname, 'test/demo/css/')
              ],
              loader: ExtractTextPlugin.extract([{
                loader: 'css-loader',
                options: {
                  url: taskOptions.taskTransUrl,
                  minimize: taskOptions.taskMinimize.css
                }
              }, {
                loader: 'postcss-loader',
                options: {
                  indent: 'poscss',
                  plugins: (loader) => [
                    require('postcss-import')({root: loader.resourcePath}),
                    require('autoprefixer')({
                      broswer: ['last 5 versions']
                    })
                  ]
                }
              }])
            },
            {
              test: /\.scss$/,
              loader: ExtractTextPlugin.extract([{
                loader: 'css-loader',
                options: {
                  url: taskOptions.taskTransUrl,
                  minimize: taskOptions.taskMinimize.css
                }
              }, {
                loader: 'postcss-loader',
                options: {
                  indent: 'poscss',
                  plugins: (loader) => [
                    require('postcss-import')({root: loader.resourcePath}),
                    require('autoprefixer')({
                      broswer: ['last 5 versions']
                    })
                  ]
                }
              }, 'sass-loader'])
            },
            {
              test: /\.less$/,
              loader: ExtractTextPlugin.extract([{
                loader: 'css-loader',
                options: {
                  url: taskOptions.taskTransUrl,
                  minimize: taskOptions.taskMinimize.css
                }
              }, {
                loader: 'postcss-loader',
                options: {
                  indent: 'poscss',
                  plugins: (loader) => [
                    require('postcss-import')({root: loader.resourcePath}),
                    require('autoprefixer')({
                      broswer: ['last 5 versions']
                    })
                  ]
                }
              }, 'less-loader'])
            },
            {
              test: /\.js$/,
              exclude: /node_modules/,
              loader: 'babel-loader',
              options: {
                "presets": ['env']
              }
            },
            {
              test: /\.html$/,
              loader: 'html-loader'
            },
            {
              test: /\.(png|jpe?g|gif|svg)$/i,
              loaders: [
                'url-loader?limit='+taskOptions.taskMinimize.img+'&name='+taskOptions.taskOutput.imgFilename+'',
                'image-webpack-loader'
              ]
            },
            {
              test: /\.vue$/,
              loader: 'vue-loader',
              options: {
                loaders: {
                  css: ExtractTextPlugin.extract([{
                    loader: 'css-loader',
                    options: {
                      url: taskOptions.taskTransUrl,
                      minimize: taskOptions.taskMinimize.css
                    }
                  }, {
                    loader: 'postcss-loader',
                    options: {
                      indent: 'poscss',
                      plugins: (loader) => [
                        require('postcss-import')({root: loader.resourcePath}),
                        require('autoprefixer')({
                          broswer: ['last 5 versions']
                        })
                      ]
                    }
                  }]),
                  scss: ExtractTextPlugin.extract([{
                    loader: 'css-loader',
                    options: {
                      url: taskOptions.taskTransUrl,
                      minimize: taskOptions.taskMinimize.css
                    }
                  }, {
                    loader: 'postcss-loader',
                    options: {
                      indent: 'poscss',
                      plugins: (loader) => [
                        require('postcss-import')({root: loader.resourcePath}),
                        require('autoprefixer')({
                          broswer: ['last 5 versions']
                        })
                      ]
                    }
                  }, 'sass-loader']),
                  less: ExtractTextPlugin.extract([{
                    loader: 'css-loader',
                    options: {
                      url: taskOptions.taskTransUrl,
                      minimize: taskOptions.taskMinimize.css
                    }
                  }, {
                    loader: 'postcss-loader',
                    options: {
                      indent: 'poscss',
                      plugins: (loader) => [
                        require('postcss-import')({root: loader.resourcePath}),
                        require('autoprefixer')({
                          broswer: ['last 5 versions']
                        })
                      ]
                    }
                  }, 'less-loader'])
                }
              }
            }
          ],
        },
        resolve: {
          alias: {
            vue: 'vue/dist/vue.js'
          },
          extensions: ['.ts', '.vue', '.js']
        },
        plugins: [
          new htmlWebpackPlugin(_.extend({
            filename: 'index.html',
            template: './test/demo/index.ejs',
            inject: false,
            title: 'this is awesome',
            publishTime: new Date().format(),
            minify: {
              removeComments: taskOptions.taskMinimize.comments,
              collapseWhitespace: taskOptions.taskMinimize.html,
              collapseInlineTagWhitespace: taskOptions.taskMinimize.html
            }
          },taskOptions.taskHtmlWebpackPlugin)),
          new uglify({
            extractComments: true
          }),
          new ExtractTextPlugin({
            filename: taskOptions.taskOutput.cssFilename,
          })
        ]
      }))
      .pipe(gulp.dest(taskOptions.taskDist));
  });
};