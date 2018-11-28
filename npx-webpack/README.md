# npx-webpack

## 1、框架功能

> Node8.2+ 支持 npx webpcak 命令来执行项目根目录下的 webpack.config.js

该项目分为三个功能配置

```text
1、根目录下的webpack.config.js供平时做项目代码压缩检测，引用资源大小检测，重复引用检测等小测试
- build目录下webpack.base.conf.js为dev及build部分共用功能代码
2、webpack.dev.conf.js为项目开发配置
3、webpack.prod.conf.js为项目生产配置
```

框架功能说明

### 1.1、功能支持：

- 以 iphone6、7、8 为标准（width=375;dpr=2），通过 postcss-px2rem 自动换算 rem（37.5px/rem;需要锁死缩放 meta）。

- 代码在 commit 之前通过 prettier+lint-staged+husky 自动格式化

- eslint 检查代码规范

- dev 下模块热替换、热刷新、自动打开浏览器

- prod 下：dist 目录下分为 img 文件夹及其他静态资源（包括 app.[hash:5].js、app.css、reset.css、index.html）、暂时 reset.css 为 css 依赖库及样式重置代码的集合，以后缀.css 识别、其余.less 样式代码，包括 vue 中 lang=less 的代码，打包到 app.css

### 1.2、部分功能实现说明

- webpack4 不设置--mode 为 development 的时候，代码会自动压缩

- webpack 默认配置结构

```javascript
module.exports = {
  entry: '', // 入口文件
  output: {}, // 出口文件
  module: {}, // 处理对应模块
  plugins: [], // 对应的插件
  devServer: {}, // 开发服务器配置
  mode: 'development', // 模式配置
}
```

- 热刷新

见： build/webpack.dev.conf.js、scripts/dev-server.js、scripts/dev-client.js

```json
{
  "vue-hot-reload-api": "^2.3.1",
  "webpack-dev-middleware": "^3.4.0",
  "webpack-hot-middleware": "^2.24.3"
}
```

- postcss-px2rem

配置参考.postcssrc.js

```json
{
  "postcss-px2rem": "^0.3.0",
  "xianyukeji-postcss-px2rem": "^0.4.1"
}
```

```text
1、postcss-px2rem：
  直接将所有px按照.postcssrc.js中设定的remUnit基准转换；
  /*no*/为不转换

2、xianyukeji-postcss-px2rem：
  升级版；
  支持将指定属性css，在媒体查询屏幕尺寸小于375的时候，不转换rem（原因是某些小尺寸的屏幕，采用rem会导致字号缩小失真）;
  支持某些指定属性如border，不做转换
```

- 文档格式强制统一

配置参考.prettierrc.js+package.json

```json
{
  "prettier": "1.15.2",
  "lint-staged": "^7.3.0",
  "husky": "^1.2.0"
}
```

```json
{
  "lint-staged": {
    "*.{js,json,css,vue,less,md}": ["prettier --write", "git add"]
  }
}
```

- 编辑器缩进配置

见.editorconfig

- eslint 规则配置

见.eslintrc.js+.eslintignore

- cross-env 将生产环境的模式绑定到进程，可以随时读取

见 webpack.base.conf.js+package.json

---

## note

uglify 可用，直接添加到 plugins 即可，但是当前版本没有使用。
因为发现 webpack4 只要设定 mode=production 即会自动压缩代码。

```text
{
  plugins: [
    new uglify({
      extractComments: true
    }),
  ],
}
```
