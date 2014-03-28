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

module.exports.protect = protect;
