var gulp = require('gulp');
var browserSync = require('browser-sync');
var del = require('del');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var minifyCss = require('gulp-minify-css');
var replace = require('gulp-replace');
var concat = require('gulp-concat')
var jade = require('gulp-jade');
var wrap = require('gulp-wrap-amd');
var _if = require('gulp-if');
var _match = require('gulp-match');
var lazypipe = require('lazypipe');
var stylish = require('jshint-stylish');
var packageJSON = require('./package');

var src_dir = 'src',
    tmp_dir = '.tmp',
    build_dir = 'build',
    cdn_url = '//localhost:9000/',
    cdn_path = packageJSON.cdnPath;

var jsChannel = {
  // 文本替换
  replace: lazypipe()
    .pipe(function () {
      return _if(/loader\/require\/index\.js/, 
        lazypipe()
          .pipe(replace, /(var\ _baseUrl\ \=\ \')[^']*(\'\;)/, '$1' + cdn_url  + '$2')
          .pipe(replace, /(var\ _basePath\ \=\ \')[^']*(\'\;)/, '$1' + cdn_path + '$2')
        ()
      );
    }),
  // 文件压缩
  compress: lazypipe()
    .pipe(uglify)
};

var jadeChannel = lazypipe()
  .pipe(jade, {
    client: true
  })
  .pipe(wrap, {
    deps: ['jade'],
    params: ['jade']
  });

// 静态检查
gulp.task('hint', function () {
  gulp.src([
    src_dir + '/**/*.js',
    '!' + src_dir + '/vendor/**/*.js',  // 不检查vendor下的js文件
    '!' + src_dir + '/loader/**/*.js'   // 不检查loader下的js文件
  ])
    .pipe(jshint())
    .pipe(jshint.reporter(stylish));
});

// 清理打包目录和临时目录
gulp.task('clean', del.bind(null, [tmp_dir, build_dir]));

// 启动开发用本地环境
gulp.task('serve', function () {
  browserSync({
    notify: true,
    port: 9000,
    server: {
      baseDir: [src_dir],
      //baseDir: [build_dir],
      middleware: function (req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');  // 跨域请求支持
        next();
      },
      routes: {
        '/base-tech-fe/data-fe': 'build'
      }
    }
  });
  // 监听文件变化
  gulp.watch([src_dir + '/**/*']).on('change', browserSync.reload);
});

// 通用打包流程
gulp.task('build', ['clean', 'hint'], function () {
  gulp.src([src_dir + '/**/*.js'])
    .pipe(jsChannel.replace())
    .pipe(jsChannel.compress())
    .pipe(gulp.dest(build_dir));
  gulp.src([src_dir + '/loader/require/require.js',
    src_dir + '/loader/require/index.js'])
    .pipe(jsChannel.replace())
    .pipe(concat('loader.js', {newLine: ';'}))
    .pipe(jsChannel.compress())
    .pipe(gulp.dest(build_dir + '/loader/require/'));
  gulp.src([src_dir + '/**/*.jade'])
    .pipe(jadeChannel())
    .pipe(gulp.dest(build_dir));
  gulp.src([src_dir + '/**/*.css'])
    .pipe(minifyCss())
    .pipe(gulp.dest(build_dir));
});

// 日常打包
gulp.task('daily', function () {
  cdn_url = packageJSON.cdnUrlDaily;
  gulp.start('build');
});

// 线上打包
gulp.task('pro', function () {
  cdn_url = packageJSON.cdnUrlPro;
  gulp.start('build');
});
