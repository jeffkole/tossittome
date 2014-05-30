var auth          = require('toss/common/auth'),
    config        = require('toss/common/config'),
    log           = require('toss/common/log'),
    appInfo       = require('../../../package.json'),
    extensionInfo = require('../../../extension/manifest.json'),
    serverInfo    = require('../../package.json');

function getVersion(request, response) {
  response.json(200, {
    version: appInfo.version,
    extension: {
      version: extensionInfo.version
    },
    server: {
      version: serverInfo.version
    }
  });
}

function postLog(request, response) {
  var level = request.params.level;
  var user = response.locals.user;
  var payload = JSON.parse(request.body.payload || '{}');
  payload.token = user.token;
  payload.version = request.query.v;

  if (log[level]) {
    log[level]('CLIENT: %j', payload);
  }
  response.send(200);
}

function getAbout(request, response) {
  var email = config.contact.help.email;
  var obfuscatedEmail = '%' + email.split('').map(function(c) { return c.charCodeAt().toString(16); }).join('%');
  response.render('info/about', {
    email: obfuscatedEmail,
    subject: encodeURIComponent('Question about Toss It To Me!')
  });
}

function setup(app, express) {
  app.get('/admin/version', getVersion);
  app.post('/admin/log/:level', auth.protect(), express.bodyParser(), postLog);

  app.get('/info/about', getAbout);
}

module.exports = setup;
