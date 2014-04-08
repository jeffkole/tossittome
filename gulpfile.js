var gulp    = require('gulp'),
    gutil   = require('gulp-util'),
    args    = require('yargs').argv,
    clean   = require('gulp-clean'),
    exec    = require('gulp-exec'),
    filter  = require('gulp-filter'),
    jshint  = require('gulp-jshint'),
    map     = require('map-stream'),
    mocha   = require('gulp-mocha'),
    nodemon = require('gulp-nodemon'),
    rename  = require('gulp-rename'),
    replace = require('gulp-replace'),
    sass    = require('gulp-sass'),
    Q       = require('q');

var logFile = function() {
  return map(function(file, cb) {
    gutil.log(file.path);
    cb(null, file);
  });
};
var resolve = function(deferred) {
  return map(function(file, cb) {
    deferred.resolve(file);
  });
};

var hosts = {
  'dev'  : { 'hostAndPort': 'localhost:9999', 'host': 'localhost' },
  'prod' : { 'hostAndPort': 'tossitto.me',    'host': 'tossitto.me' }
};

gulp.task('clean', function() {
  return gulp.src('build', { read: false })
      .pipe(clean());
});

var copyExtension = function(env) {
  return function() {
    var deferred = Q.defer();
    var notImageFilter = filter('!**/*.png');
    gulp.src('extension/**')
        .pipe(logFile())
        .pipe(notImageFilter)
        .pipe(replace(/localhost:9999/g, hosts[env]['hostAndPort']))
        .pipe(replace(/localhost/g,      hosts[env]['host']))
        .pipe(notImageFilter.restore())
        .pipe(gulp.dest('build/dist/extension/' + env))
        .pipe(resolve(deferred));
    return deferred.promise;
  };
};
var packExtension = function(env) {
  return function() {
    var deferred = Q.defer();
    gulp.src('build/dist/extension/' + env)
        .pipe(logFile())
        .pipe(exec('./bin/pack_extension.sh <%= file.path %> ~/.ssh/tossittome/extension.pem'))
        .pipe(resolve(deferred));
    return deferred.promise;
  };
};
var putPackIntoServer = function(env) {
  return function() {
    var deferred = Q.defer();
    gulp.src('build/dist/extension/' + env + '.crx')
        .pipe(rename('extension.crx'))
        .pipe(gulp.dest('server/extension'))
        .pipe(resolve(deferred));
    return deferred.promise;
  };
};

gulp.task('pack-extension', ['clean'], function() {
  var env = 'prod';
  gutil.log('Env: ' + env);
  copyExtension(env)()
    .then(packExtension(env))
    .then(putPackIntoServer(env))
    .done();
});

gulp.task('scss', function() {
  gulp.src('server/scss/**/*.scss')
      .pipe(sass())
      .pipe(gulp.dest('server/public/css/'));
});

gulp.task('lint', function() {
  var files = ['server/server.js', 'server/app/**/*.js'];
  if (args.t || args.test) {
    files = files.concat(['test/server/app/**/*.js', 'test/server/test/*.js']);
  }
  gulp.src(files)
      .pipe(jshint())
      .pipe(jshint.reporter('default'));
});

gulp.task('run', ['scss'], function() {
  nodemon({
      script: 'server/server.js',
      ext   : 'js',
      env   : { 'NODE_ENV': 'development' }
    });
  gulp.watch('server/scss/**/*.scss', ['scss']);
});

gulp.task('test', function() {
  process.env.NODE_ENV = 'test';
  var options = {
    reporter: 'spec',
    ignoreLeaks: false
  };
  if (args.g || args.grep) {
    options.grep = args.g || args.grep;
  }
  gulp.src('test/server/app/**/*.js')
      .pipe(mocha(options));
  if (args.w || args.watch) {
    gulp.watch(['server/app/**/*.js', 'test/server/app/**/*.js'], ['test']);
  }
});

gulp.task('default', ['run']);
