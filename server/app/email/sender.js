var fs       = require('fs'),
    mandrill = require('mandrill-api/mandrill'),
    merge    = require('object-merge'),
    path     = require('path'),
    config   = require('toss/common/config'),
    log      = require('toss/common/log');

var client = new mandrill.Mandrill(config.email.api_key);

var defaultMessageOptions = {
  from_email: 'info@tossitto.me',
  from_name: 'Toss It To Me!',
  important: false,
  track_opens: true,
  track_clicks: true,
  auto_text: true,
  inline_css: true,
  url_strip_qs: true,
  preserve_recipients: true,
  view_content_link: true,
  tracking_domain: 'track.mail.tossitto.me',
  signing_domain: 'tossitto.me',
  return_path_domain: 'return.mail.tossitto.me',
  subaccount: config.email.subaccount
};

var emailContents = {
  'catcher_request': {}
};

function initialize() {
  var emailsPath = path.normalize(path.join(__dirname, '../../emails'));
  var readFileOptions = { encoding: 'UTF-8' };
  var read = function(type, file) {
    return fs.readFileSync(path.join(emailsPath, type, file), readFileOptions).toString();
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
  var message = {
    html: emailContents[type].bodyHtml,
    text: emailContents[type].bodyText,
    subject: emailContents[type].subject,
    to: [{
      email: toEmail,
      // name: '',
      type: 'to'
    }],
    headers: {
      'Reply-To': 'noreply@tossitto.me',
    },
    tags: [ type ],
    global_merge_vars: [{
      name: 'host', content: config.host
    }, {
      name: 'requestingUser', content: requestingUser.email
    }, {
      name: 'responseUri', content: responseUri
    }]
  };
  message = merge(defaultMessageOptions, message);
  client.messages.send({
    message : message,
    async   : false
  }, function(result) {
    log.info('Email sent: %j', result);
    return cb(null, result);
  }, function(error) {
    log.error('Error while sending', error);
    return cb(error);
  });
}

module.exports = {
  sendCatcherRequest : sendCatcherRequest
};
