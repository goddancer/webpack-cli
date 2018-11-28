const gulp = require('gulp');
const path = require('path');
const webpack = require('webpack-stream');
const htmlWebpackPlugin = require('html-webpack-plugin');
const uglify = require('uglifyjs-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

gulp.task('default', function() {
  return gulp.src('src/entry.js')
    .pipe(webpack({
      watch: false,
      entry: {
        app: './test/demo/js/main.js',
        // test: 'test/test.js',
      },
      output: {
        filename: 'js/[name].js',
        publicPath: './'
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
                url: false,
                // minimize: true
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
                url: false,
                // minimize: true
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
                url: false,
                // minimize: true
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
            loader: 'babel-loader', // https://github.com/webpack-contrib/eslint-loader
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
              // 'url-loader?limit=20000&name=img/[name]-[hash:5].[ext]',
              'url-loader?limit=20000&name=img/[name].[ext]',
              'image-webpack-loader'
            ]
          },
          {
            test: /\.vue$/,
            loader: 'vue-loader',
            options: {
              loaders: {
                // html: 'html-loader',
                // js: 'babel-loader',
                css: ExtractTextPlugin.extract([{
                  loader: 'css-loader',
                  options: {
                    url: false,
                    // minimize: true
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
                    url: false,
                    // minimize: true
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
                    url: false,
                    // minimize: true
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
          vue: 'vue/dist/vue.js',
          eslint: 'eslint/bin/eslint.js',
          'eslint-loader': 'eslint-loader/index.js'
        },
        extensions: ['.ts', '.vue', '.js']
      },
      plugins: [
        new htmlWebpackPlugin({
          filename: 'index.html',
          template: './test/demo/index.ejs',
          inject: false,
          title: 'goddancer is awesome',
          publishTime: new Date().format(),
          minify: {
            removeComments: true,
            collapseWhitespace: true,
            collapseInlineTagWhitespace: true,
          }
        }),
        new uglify({
          extractComments: true
        }),
        new ExtractTextPlugin({
          filename: 'css/[name].css',
        })
      ]
    }))
    .pipe(gulp.dest('./test/demo/dist/'));
});
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