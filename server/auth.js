function protect() {
  return function(request, response, next) {
    if (request.cookies.token) {
      next();
    }
    else {
      response.redirect('/');
    }
  };
}

function allowOrigin() {
  return function(request, response, next) {
    var origin = request.get('origin');
    if (origin && origin.indexOf('chrome-extension://') == 0) {
      response.set({
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true'
      });
    }
    next();
  };
}

module.exports.protect = protect;
module.exports.allowOrigin = allowOrigin;
