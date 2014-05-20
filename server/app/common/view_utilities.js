var moment   = require('moment'),
    url      = require('url'),
    log      = require('toss/common/log');

function attachQueryParams(request, response) {
  return function(uri) {
    var originalUrl = url.parse(uri, true);
    // Must clear out the search property, since it overrides the query value
    originalUrl.search = null;
    var query = originalUrl.query || {};
    Object.keys(request.query).forEach(function(key) {
      // Do not overwrite any query params set explicitly
      if (!query[key]) {
        query[key] = request.query[key];
      }
    });
    originalUrl.query = query;
    var completeUrl = url.format(originalUrl);
    return completeUrl;
  };
}

function relativeTime(date) {
  // `date` is the JavaScript Date.toString result, which looks like this:
  // Fri May 16 2014 10:21:44 GMT-0700 (PDT)
  // moment does not want to deal with that directly anymore, so create the date
  // manually and pass that to moment:
  // https://github.com/moment/moment/issues/1407
  return moment(new Date(date)).fromNow();
}

function setup(app) {
  app.use(function(request, response, next) {
    response.locals.lambdas = response.locals.lambdas || {};
    response.locals.lambdas.attachQueryParams = attachQueryParams(request, response);
    response.locals.lambdas.relativeTime = relativeTime;
    next();
  });
}

module.exports = setup;
