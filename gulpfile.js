var gulp    = require('gulp'),
    gutil   = require('gulp-util'),
    clean   = require('gulp-clean'),
    exec    = require('gulp-exec'),
    filter  = require('gulp-filter'),
    gzip    = require('gulp-gzip'),
    map     = require('map-stream'),
    rename  = require('gulp-rename'),
    replace = require('gulp-replace'),
    tar     = require('gulp-tar'),
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

gulp.task('clean', function(cb) {
  return gulp.src('build', { read: false })
      .pipe(clean());
});

gulp.task('pack-extensions', ['clean'], function() {
  Object.keys(hosts).forEach(function(env) {
    gutil.log('Env: ' + env);
    var deferred = Q.defer();
    var notImageFilter = filter('!**/*.png');
    gulp.src('extension/**')
        .pipe(notImageFilter)
        .pipe(replace(/{{ host }}/g, hosts[env]['host']))
        .pipe(replace(/{{ hostAndPort }}/g, hosts[env]['hostAndPort']))
        .pipe(notImageFilter.restore())
        .pipe(gulp.dest('build/dist/extension/' + env))
        .pipe(resolve(deferred));
    deferred.promise.then(function() {
      gulp.src('build/dist/extension/' + env)
          .pipe(logFile())
          .pipe(exec('./bin/pack_extension.sh <%= file.path %> ~/.ssh/tossittome.pem'));
      }).done();
  });
});

var copyServer = function(env) {
  return function() {
    var deferred = Q.defer();
    gulp.src('server/**')
        .pipe(gulp.dest('build/dist/server/' + env))
        .pipe(resolve(deferred));
    return deferred.promise;
  };
};
var copyExtension = function(env) {
  return function() {
    var deferred = Q.defer();
    gulp.src('build/dist/extension/' + env + '.crx')
        .pipe(rename('extension.crx'))
        .pipe(gulp.dest('build/dist/server/' + env + '/extension'))
        .pipe(resolve(deferred));
    return deferred.promise;
  };
};
var tarServer = function(env) {
  return function() {
    var deferred = Q.defer();
    gulp.src('**', { 'cwd': process.cwd() + '/build/dist/server/' + env })
        .pipe(tar(env + '-server.tar'))
        .pipe(gzip())
        .pipe(gulp.dest('build/dist'))
        .pipe(resolve(deferred));
    return deferred.promise;
  };
};

gulp.task('dist', function() {
  var env = 'prod';
  copyServer(env)()
    .then(copyExtension(env))
    .then(tarServer(env))
    .done();
});
