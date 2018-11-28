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
    taskHtmlEntry: './test/demo/index.html',
    taskJsEntry: './test/demo/js/main.js',
    taskCssEntry: './test/demo/css/',
    taskDist: './test/demo/dist/',
    inject: false,
    taskOutput: {
      htmlFilename: 'index.html',
      jsFilename: 'js/[name].js',
      cssFilename: 'css/[name].css',
      imgFilename: 'img/[name].[ext]',
      publicPath: './'
    },
    taskMinimize: {
      css: true,
      html: true,
      img: '10000',
      comments: true
    },
    taskTransUrl: false
  }, options);
  gulp.task(taskOptions.taskName, function() {
    return gulp.src('src/entry.js')
      .pipe(webpack({
        watch: taskOptions.taskWatch,
        entry: {
          app: taskOptions.taskJsEntry,
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
                path.join(__dirname, taskOptions.taskCssEntry)
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
                      broswer: ['last 5 versions'],
                      remove: false
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
                      broswer: ['last 5 versions'],
                      remove: false
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
                      broswer: ['last 5 versions'],
                      remove: false
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
              loader: 'html-loader',
              exclude: /index\.html/
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
                          broswer: ['last 5 versions'],
                          remove: false
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
                          broswer: ['last 5 versions'],
                          remove: false
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
                          broswer: ['last 5 versions'],
                          remove: false
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
          new htmlWebpackPlugin({
            filename: taskOptions.taskOutput.htmlFilename,
            template: taskOptions.taskHtmlEntry,
            inject: taskOptions.inject,
            title: 'this is awesome',
            publishTime: new Date().format(),
            minify: {
              removeComments: taskOptions.taskMinimize.comments,
              collapseWhitespace: taskOptions.taskMinimize.html,
              collapseInlineTagWhitespace: taskOptions.taskMinimize.html
            }
          }),
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