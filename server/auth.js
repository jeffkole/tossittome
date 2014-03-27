function protect(paths) {
  return function(request, response, next) {
    // Only require authentication for specified paths
    if (paths.indexOf(request.path) == -1) {
      next();
    }
    else if (request.cookies.token) {
      next();
    }
    else {
      response.redirect('/');
    }
  };
}

module.exports.protect = protect;
