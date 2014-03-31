var gulp    = require('gulp'),
    gutil   = require('gulp-util'),
    clean   = require('gulp-clean'),
    exec    = require('gulp-exec'),
    filter  = require('gulp-filter'),
    map     = require('map-stream'),
    rename  = require('gulp-rename'),
    replace = require('gulp-replace'),
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
        .pipe(replace(/{{ host }}/g, hosts[env]['host']))
        .pipe(replace(/{{ hostAndPort }}/g, hosts[env]['hostAndPort']))
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
        .pipe(exec('./bin/pack_extension.sh <%= file.path %> ~/.ssh/tossittome.pem'))
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
