var crypto  = require('crypto'),
    base64  = require('js-base64').Base64,
    userDao = require('toss/user/dao'),
    util    = require('toss/user/util');

function authenticate(connection, email, password, cb) {
  userDao.fetchUserByEmail(connection, email, function(error, user) {
    if (error) {
      cb(error);
    }
    else if (user.noResults) {
      cb(null, { noResults: true });
    }
    else if (util.validatePassword(password, user.password)) {
      cb(null, user);
    }
    else {
      cb(null, { invalidPassword: true });
    }
  });
}

module.exports = {
  authenticate : authenticate
};
