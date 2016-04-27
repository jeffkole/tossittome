var fs       = require('fs'),
    hogan    = require('hogan.js'),
    merge    = require('object-merge'),
    path     = require('path'),
    sendgrid = require('sendgrid'),
    config   = require('toss/common/config'),
    log      = require('toss/common/log');

var client = sendgrid(config.email.api_key);

var defaultMessageOptions = {
  from: 'info@tossitto.me',
  fromname: 'Toss It To Me!',
  replyto: 'noreply@tossitto.me',
  bcc: 'jeff.kolesky@gmail.com'
};

var emailContents = {
  'catcher_request': {}
};

function initialize() {
  var emailsPath = path.normalize(path.join(__dirname, '../../emails'));
  var readFileOptions = { encoding: 'UTF-8' };
  var read = function(type, file) {
    return hogan.compile(fs.readFileSync(path.join(emailsPath, type, file), readFileOptions).toString());
  };
  Object.keys(emailContents).forEach(function(type) {
    emailContents[type].bodyHtml = read(type, 'body.html');
    emailContents[type].bodyText = read(type, 'body.txt');
    emailContents[type].subject  = read(type, 'subject.txt');
  });
}
initialize();

function sendCatcherRequest(toEmail, requestingUser, responseUri, cb) {
  var type = 'catcher_request';
  var context = {
    host: config.host,
    requestingUser: requestingUser.email,
    responseUri: responseUri
  };
  var subject = emailContents[type].subject.render(context);
  var html = emailContents[type].bodyHtml.render(context);
  var text = emailContents[type].bodyText.render(context);
  var message = {
    to: toEmail,
    subject: subject,
    html: html,
    text: text
  };
  message = merge(defaultMessageOptions, message);
  var email = new client.Email(message);

  client.send(email, function(error, result) {
    if (error) {
      log.error('Error while sending', error);
      return cb(error);
    }
    log.info('Email sent: %j', result);
    return cb(null, result);
  });
}

module.exports = {
  sendCatcherRequest : sendCatcherRequest
};
