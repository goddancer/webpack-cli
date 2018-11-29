const gulpConfig = require('./.gulpconfig');

const taskConfig = {
  taskName: 'default',
  mode: 'development',
  htmlPath: './test/demo/index.preprocess.htm',
  jsPath: 'test/demo/js/main.js',
  distPath: 'dist/demo/',
  watchFiles: ['test/demo/js/main.js', 'test/demo/css/index.less']
}
gulpConfig.createGulpTask(taskConfig)
gulpConfig.watch(taskConfig)

let newConfig = JSON.parse(JSON.stringify(taskConfig))
newConfig.taskName = 'hola'
gulpConfig.createGulpTask(newConfig)
