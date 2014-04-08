var crypto  = require('crypto'),
    base64  = require('js-base64').Base64;

function validatePassword(plain, hashed) {
  return hashPassword(plain, hashed.substring(0, 3)) == hashed;
}

function hashPassword(plain, salt) {
  if (arguments.length == 1) {
    salt = base64.encodeURI(crypto.randomBytes(2));
  }
  var hashed =
    base64.encode(
        crypto.createHash('sha1').
        update(salt).
        update(plain).
        digest('binary'));
  return (salt + hashed);
}

module.exports = {
  validatePassword : validatePassword,
  hashPassword     : hashPassword
};
