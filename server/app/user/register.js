var crypto  = require('crypto'),
    base64  = require('js-base64').Base64,
    userDao = require('toss/user/dao'),
    util    = require('toss/user/util');

function generateToken(email) {
  var rawToken = crypto.randomBytes(8).toString() + ':' + email;
  return base64.encodeURI(crypto.createHash('sha1').update(rawToken).digest('binary'));
}

function addUser(connection, email, password, cb) {
  var token = generateToken(email);
  var hashedPassword = util.hashPassword(password);
  userDao.insertUser(connection, email, hashedPassword, token, cb);
}

module.exports = {
  addUser : addUser
};
