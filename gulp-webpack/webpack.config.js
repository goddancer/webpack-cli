module.exports = {
  mode: 'development', // 设置输出模式为开发版
  entry: './src/script/main.js', // 设置入口
  output: {
    path: __dirname + "/dist/js", // 出口要用绝对路径指定__dirname
    filename: "bundle.js"
  }
};