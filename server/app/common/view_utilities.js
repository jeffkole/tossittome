var url = require('url');

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

function setup(app) {
  app.use(function(request, response, next) {
    response.locals.attachQueryParams = attachQueryParams(request, response);
    next();
  });
}

module.exports = setup;
