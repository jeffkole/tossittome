var gulp    = require('gulp'),
    gutil   = require('gulp-util'),
    clean   = require('gulp-clean'),
    exec    = require('gulp-exec'),
    filter  = require('gulp-filter'),
    map     = require('map-stream'),
    replace = require('gulp-replace'),
    Q       = require('q');

var logFile = function() {
  return map(function(file, cb) {
    gutil.log(file.path);
    cb(null, file);
  });
}
var resolve = function(deferred) {
  return map(function(file, cb) {
    deferred.resolve(file);
  });
}

var hosts = {
  'dev'  : 'localhost:9999',
  'prod' : 'tossitto.me'
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
        .pipe(replace(/{{ host }}/g, hosts[env]))
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
