var db      = require('toss/common/db'),
    userDao = require('toss/user/dao');

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

function populateUser() {
  return function(request, response, next) {
    if (request.cookies.token) {
      var connection = db.getConnection();
      userDao.fetchUserByToken(connection, request.cookies.token, function(error, user) {
        if (error) {
          response.send(500, error);
        }
        else if (user.noResults) {
          // Clear the fraudulent cookie
          response.clearCookie('token');
        }
        else {
          response.locals.user = user;
        }
        db.closeConnection(connection);
        next();
      });
    }
    else {
      next();
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
  protect      : protect,
  populateUser : populateUser,
  allowOrigin  : allowOrigin
};
