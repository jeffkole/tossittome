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

function allowOrigin(extensionOnly) {
  return function(request, response, next) {
    var origin = request.get('origin');
    if (origin) {
      if ((extensionOnly && origin.indexOf('chrome-extension://') === 0) ||
          !extensionOnly) {
            response.set({
              'Access-Control-Allow-Origin': origin,
              'Access-Control-Allow-Credentials': 'true'
            });
      }
    }
    next();
  };
}

module.exports = {
  protect     : protect,
  allowOrigin : allowOrigin
};
