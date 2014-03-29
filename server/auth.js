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
    console.log('Request headers', request.headers);
    if (origin && origin.indexOf('chrome-extension://') == 0) {
      console.log('Setting allow-origin to %s', origin);
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
