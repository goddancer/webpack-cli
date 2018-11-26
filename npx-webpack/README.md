# npx-webpack

- webpack4不设置--mode为development的时候，代码会自动压缩

- webpack默认配置结构
```javascript
module.exports = {
    entry: '',               // 入口文件
    output: {},              // 出口文件
    module: {},              // 处理对应模块
    plugins: [],             // 对应的插件
    devServer: {},           // 开发服务器配置
    mode: 'development'      // 模式配置
}
```
