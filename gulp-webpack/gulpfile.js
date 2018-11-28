/*
const gulpTask = require('./.gulplock');
gulpTask({
  taskName: 'default',
  taskWatch: false,
  inject: false,
  taskHtmlEntry: './test/demo/index.html',
  taskJsEntry: './test/demo/js/main.js',
  taskCssEntry: './test/demo/css/',
  taskDist: './test/demo/dist/',
});*/
const gulp = require('gulp');
const webpack = require('webpack-stream');
gulp.task('default', function() {
  return gulp.src('test/demo/js/main.js')
    .pipe(webpack({
      config : require('./config/webpack.base.conf')
    }))
    .pipe(gulp.dest('dist/'));
});