var crypto  = require('crypto'),
    base64  = require('js-base64').Base64;

function generate(key /* , key, ... */) {
  var data = (new Array(arguments)).join(':');
  var rawToken = crypto.randomBytes(8).toString() + ':' + data;
  return base64.encodeURI(crypto.createHash('sha1').update(rawToken).digest('binary'));
}

module.exports = {
  generate : generate
};
