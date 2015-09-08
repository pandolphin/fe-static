
'use strict';

var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var browserSync = require('browser-sync');
var jade = require('gulp-jade');
var reload = browserSync.reload;

var BROWSER_SYNC_DELAY = 500;


gulp.task('nodemon', function (cb) {
  var called = false;
  return nodemon({
    script: 'bin/www',
    watch: ['bin/www']
  })
  .on('start', function onStart(){
     if(!called) {cb();}
     called = true;
  })
  .on('restart', function onRestart() {
    setTimeout(function reload(){
      browserSync.reload({
        stream: false
      });
    }, BROWSER_SYNC_DELAY);
  });
});

//jade模板编译
gulp.task('templates', function(){
  var YOUR_LOCALS = {};
  return gulp.src('views/*jade')
    .pipe(jade({
      locals: YOUR_LOCALS
    }))
    .pipe(gulp.dest('./dist/'))

});
gulp.task('jade-watch', ['templates'], reload);

gulp.task('js', function(){
  return gulp.src('public/**/*.js')
    .pipe(gulp.dest('./dist/js'));

});
gulp.task('js-watch', ['js'], reload);

gulp.task('browser-sync', ['nodemon', 'templates', 'js'], function(){
  browserSync.init({
    files: ['publid/**/*.*'],
    proxy: 'http://localhost:3000',
    port:4000
  });
  gulp.watch('views/*.jade', ['jade-watch']);
  gulp.watch('public/**/*.js', ['js-watch']);
});

gulp.task('default', ['browser-sync']);

