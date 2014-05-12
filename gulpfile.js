var gulp    = require('gulp'),
    gutil   = require('gulp-util'),
    args    = require('yargs').argv,
    bump    = require('gulp-bump'),
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
    zip     = require('gulp-zip'),
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
  var notImageFilter = filter('!**/*.png');
  var notScssFilter  = filter('!**/*.scss');
  return gulp.src('extension/**')
      .pipe(notImageFilter)
      .pipe(notScssFilter)
      .pipe(logFile())
      .pipe(replace(/localhost:9999/g, hosts[env]['hostAndPort']))
      .pipe(replace(/localhost/g,      hosts[env]['host']))
      .pipe(notImageFilter.restore())
      .pipe(gulp.dest('build/dist/extension/' + env));
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

gulp.task('pack-extension', ['clean', 'scss-extension'], function() {
  var env = 'prod';
  gutil.log('Env: ' + env);
  var deferred = Q.defer();
  copyExtension(env)
    .pipe(resolve(deferred));
  deferred.promise
    .then(packExtension(env))
    .then(putPackIntoServer(env))
    .done();
});

gulp.task('zip-extension', ['clean', 'scss-extension'], function() {
  var env = 'prod';
  return copyExtension(env)
    .pipe(zip(env + '.zip'))
    .pipe(gulp.dest('build/dist/extension'));
});

gulp.task('scss-server', function() {
  return gulp.src('server/scss/**/*.scss')
      .pipe(sass())
      .pipe(gulp.dest('server/public/css/'));
});

gulp.task('scss-extension', function() {
  return gulp.src('extension/scss/**/*.scss')
      .pipe(sass())
      .pipe(gulp.dest('extension/'));
});

gulp.task('lint-src', function() {
  var files = ['server/server.js', 'server/app/**/*.js', 'server/views/**/*.js', '!server/views/**/*_response.js', 'extension/*.js'];
  return gulp.src(files)
      .pipe(jshint())
      .pipe(jshint.reporter('default'));
});

gulp.task('lint-test', function() {
  var files =['test/server/app/**/*.js', 'test/server/test/*.js'];
  return gulp.src(files)
      .pipe(jshint({'expr': true})) // turn of the warning that results from using 'should'
      .pipe(jshint.reporter('default'));
});

gulp.task('lint', ['lint-src', 'lint-test']);

gulp.task('bump', function() {
  var type = 'patch';
  if (args.m || args.minor) {
    type = 'minor';
  }
  if (args.M || args.major) {
    type = 'major';
  }
  return gulp.src('package.json')
      .pipe(bump({ type: type }))
      .pipe(gulp.dest('./'));
});

gulp.task('run', ['scss-server', 'scss-extension'], function() {
  nodemon({
      script: 'server/server.js',
      ext   : 'js',
      env   : { 'NODE_ENV': 'development' },
      verbose: true,
      ignore : ['gulpfile.js', '*.sw?', 'graphics/**/*', '*.html']
    });
  gulp.watch('server/scss/**/*.scss', ['scss-server']);
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
  gulp.src(['test/server/suite.js', 'test/server/app/**/*.js'])
      .pipe(mocha(options));
  if (args.w || args.watch) {
    gulp.watch(['server/app/**/*.js', 'test/server/app/**/*.js'], ['test']);
  }
});

gulp.task('default', ['run']);
