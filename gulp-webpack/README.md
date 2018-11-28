# webpack-stream
类似于webpack，只不过将打包操作交给了gulp，托管在gulpfile中配置webpack打包规则，从而实现多项目公用webpack打包配置。
## 安装
### 1、npm初始化
```
npm init // 在项目目录新增package.json
```
### 2、安装依赖
安装的依赖部分已经不再更新（废弃），但不影响使用；部分依赖对高版本node不支持。
当出现问题时：
1）删除package-lock.json，删除node_modules，执行npm i
or
2）删除node_modules，逐一安装依赖
#### webpack-stream
鉴于gulp-webpack已经废弃，安装最新的webpack-stream
```
npm install webpack-stream --save-dev
npm install gulp --save-dev // 安装gulp
```
#### css-loader
css-loader用于解析css
```
npm install css-loader --save-dev
```
#### style-loader
style-loader用于将解析的css包裹在style标签中，插入html
```
npm install style-loader --save-dev
```
#### postcss-loader&autoprefixer
autoprefixer依赖于postcss-loader&postcss-import。
autoprefixer用于自动添加浏览器支持的前缀，兼容化css样式处理。
```
npm install postcss-import postcss-loader --save-dev // 安装postcss并配置，自动添加浏览器前缀。需要postcss-import依赖
```
postcss-loader配置比较特殊，而且需要注意配置是loader解析的顺序。

这里结合<a href="#1">sass-loader&less-loader</a>配置说明。
#### <a name="1">sass-loader&less-loader</a>
sass-loader需要安装node-sass>=4.0版本的依赖。

依赖顺序：sass-loader>postcss-loader>css-loader>style-loader
```
npm install node-sass sass-loader --save-dev

{
    test: /\.scss$/,
    loaders: ['style-loader', 'css-loader', {
      loader: 'postcss-loader',
      options: {
        indent: 'poscss', // 唯一身份标识
        plugins: (loader) => [
          require('postcss-import')({root: loader.resourcePath}),
          require('autoprefixer')({
            broswer: ['last 5 versions'] // 自动填充上五个版本浏览器支持
          })
        ]
      }
    }, 'sass-loader']
}
```
```
npm install less less-loader --save-dev // 同上
```
#### babel-loader
babel-loader基于babel-core以及babel-preset-env作为其部分功能实现的依赖。
```
npm install babel-core babel-loader --save-dev // 需要babel-loader
npm install babel-preset-env --save-dev // 使用babel处理es2015、26、17及最新语法依赖

{
    test: /\.js$/,
    exclude: /node_modules/, // 排除
    loader: 'babel-loader',
    options: {
      "presets": ['env'] // 解析最新版本之下的语法
    }
}
```
#### file-loader&url-loader&image-webpack-loader
file-loader实现图片的路径引用。

url-loader实现图片的大小限制（limit）。

image-webpack-loader实现图片的压缩。
```
npm install file-loader --save-dev // 仅需要url-loader是不行的
npm install url-loader --save-dev

npm install image-webpack-loader --save-dev // url-loader的limit计算会根据image-webpack-loader将图片压缩以后的大小判断

{
    test: /\.(png|jpe?g|gif|svg)$/i,
    loaders: [
      'url-loader?limit=20000&name=img/[name]-[hash:5].[ext]',
      'image-webpack-loader' // 实现图片压缩
    ]
}

#简单写法

{
    test: /\.(png|jpe?g|gif|svg)$/i,
    loader: 'url-loader',
    query: {
      limit: '20000',
      name: 'img/[name]-[hash:5].[ext]'
    }
}
```
#### html-loader
```
npm install html-loader --save-dev

{
    test: /\.html$/,
    loader: 'html-loader'
}

```
#### $
```
npm install jquery --save-dev

externals: {
    jquery: 'window.$' // 暂时不需要
}
```
#### vue&vue-loader&vue-template-compiler
vue依赖vue-template-compiler，并且vue版本需要与vue-template-compiler版本一致。

```
npm install vue@2.5.16 --save-dev
npm install vue-template-comiler@2.5.16 --save-dev
npm install vue-loader --save-dev

{
    test: /\.vue$/,
    loader: 'vue-loader'
}

resolve: {
    alias: {
      vue: 'vue/dist/vue.js' // 指定vue.js依赖具体位置
    },
    extensions: ['.ts', '.vue', '.js'] // 指定解析拓展
}
```
vue-loader中配置scss支持，[参考](https://github.com/vuejs/vue-loader/issues/363)
```

```
### 3、plugins
#### html-webpack-plugin
实现：
1）js输出物的自动添加

2）依赖chunk的指定引用（参考webpack-test branch-loader README [传送门](https://github.com/goddancer/webpack-test/tree/loader)）

3）基于ejs模板引擎语法的支持，伪后端输出。

4）html压缩（注释，空格等）
```
npm install html-webpack-plugin --save-dev

plugins: [
    new htmlWebpackPlugin({
      filename: 'index.html', // 输出目录基准
      template: './test/demo/index.ejs', // 解析目录基准
      inject: 'body',
      title: 'goddancer is awesome',
      minify: {
        removeComments: true, // 移除注释
        collapseWhitespace: true, // 移除空格
        collapseInlineTagWhitespace: true, // 移除标签行间空格
      }
    })
]

<%= htmlWebpackPlugin.options.title %> // ejs
```
#### uglifyjs-webpack-plugin
webpack自带js压缩工具，如果未找到，手动安装。
```
npm install uglifyjs-webpack-plugin --save-dev

const uglify = require('uglifyjs-webpack-plugin');

plugins: [
    new uglify({
      extractComments: true // 删除注释
    })
]
```
#### extract-text-webpack-plugin
把css和js打包在一起，减少实际请求的次数，但是由于编译出来的js文件比较大，浪费带宽。因此，我们使用extract-text-webpack-plugin插件，把css文件编译成独立的文件。我们就可以利用CDN把这个文件推送到节点服务器，或者根据视情况按需加载，进而优化客户请求链路，加速页面响应。

[参考帖子](https://juejin.im/post/5a4eb795f265da3e52344c94)

[以原路径解析](https://github.com/webpack-contrib/extract-text-webpack-plugin/blob/master/README.md)
```
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

{
    test: /\.css$/,
    include: [
      path.join(__dirname, 'test/demo/css/')
    ],
    use: ExtractTextPlugin.extract({
      fallback: 'style-loader',
      use: 'css-loader'
    })
}

plugins: [
    new ExtractTextPlugin({
      filename: 'css/[name].css'
    })
]
```
```
{
    test: /\.css$/,
    include: [
      path.join(__dirname, 'test/demo/css/')
    ],
    loader: ExtractTextPlugin.extract([{
      loader: 'css-loader',
      options: {
        url: false, // 以原路径解析
        minimize: true
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
}
```
### 4、创建gulpfile.js并初始化
```
const gulp = require('gulp');
const webpack = require('webpack-stream');
gulp.task('default', function() {
  return gulp.src('src/entry.js')
    .pipe(webpack({
      watch: false,
      entry: {
        app: './test/demo/js/main.js', // 入出口要加上./
        // test: 'test/test.js',
      },
      output: {
        filename: '[name].js',
      },
      module: {
        loaders: [
          {
            test: /\.css$/,
            loader: 'style-loader!css-loader' // -loader不能省略
          }
        ],
      },
    }))
    .pipe(gulp.dest('./test/demo/dist/'));
});
```
### 5、eslint
```
```
### END、完整任务配置
```
const gulp = require('gulp');
const webpack = require('webpack-stream');
const htmlWebpackPlugin = require('html-webpack-plugin');
const uglify = require('uglifyjs-webpack-plugin');

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
            loaders: ['style-loader', {
              loader: 'css-loader',
              options: {
                minimize: true // 压缩css到一行
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
            }]
          },
          {
            test: /\.scss$/,
            loaders: ['style-loader', {
              loader: 'css-loader',
              options: {
                minimize: true
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
            }, 'sass-loader']
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
            test: /\.less$/,
            loaders: ['style-loader', {
              loader: 'css-loader',
              options: {
                minimize: true
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
            }, 'less-loader']
          },
          {
            test: /\.(png|jpe?g|gif|svg)$/i,
            loaders: [
              'url-loader?limit=20000&name=img/[name]-[hash:5].[ext]',
              'image-webpack-loader'
            ]
          },
          {
            test: /\.vue$/,
            loader: 'vue-loader'
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
          filename: 'index.html',
          template: './test/demo/index.ejs',
          inject: 'body',
          title: 'goddancer is awesome',
          minify: {
            removeComments: true,
            collapseWhitespace: true,
            collapseInlineTagWhitespace: true,
          }
        }),
        new uglify({
          extractComments: true
        })
      ]
    }))
    .pipe(gulp.dest('./test/demo/dist/'));
});
```
```
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
          inject: 'body',
          title: 'goddancer is awesome',
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
```
---
https://github.com/gulpjs/gulp-util