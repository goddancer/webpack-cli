const gulp = require('gulp');
const webpack = require('webpack-stream');

const webpackConfig = require('./webpack.base.conf')
const gulpConfig = {}

gulpConfig.createGulpTask = config => {
  return gulp.task(config.taskName, function() {
    return gulp.src(config.jsPath)
      .pipe(webpack({
        config : webpackConfig(config)
      }))
      .pipe(gulp.dest(config.distPath));
  });
}
gulpConfig.watch = config => {
  gulp.task(`watch_${config.taskName}`, [config.taskName], function() {
    gulp.watch(config.watchFiles, [config.taskName]);
  });
}
module.exports = gulpConfig