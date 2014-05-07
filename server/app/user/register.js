var token   = require('toss/common/token'),
    userDao = require('toss/user/dao'),
    util    = require('toss/user/util');

function addUser(connection, email, password, cb) {
  var userToken = token.generate(email);
  var hashedPassword = util.hashPassword(password);
  userDao.insertUser(connection, email, hashedPassword, userToken, cb);
}

module.exports = {
  addUser : addUser
};
