var fs       = require('fs'),
    hogan    = require('hogan.js'),
    path     = require('path'),
    uaparser = require('ua-parser-js'),
    auth     = require('toss/common/auth'),
    db       = require('toss/common/db'),
    log      = require('toss/common/log'),
    page     = require('toss/page/page');

var bookmarkletTemplate =
  hogan.compile(
    fs.readFileSync(
      path.normalize(
        path.join(__dirname, '../../views/getting-started/bookmarklet.js')), { encoding: 'UTF-8' }));

var extensionInfo = require('../../../extension/manifest.json');

function renderLoggedInHome(request, response) {
  var user = response.locals.user;
  var connection = db.getConnection();
  page.getTossHistory(connection, user.id, 0, 5, function(error, tosses) {
    if (error) {
      response.send(500, error);
    }
    else {
      response.render('home', {
        noTosses : tosses.noResults,
        tosses   : tosses
      });
    }
    db.closeConnection(connection);
  });
}

function renderAnonymousHome(request, response) {
  response.render('index', {
    layout: 'layouts/skeleton.html'
  });
}

function getHome(request, response) {
  // The user will be populated by the authentication mechanism
  if (response.locals.user) {
    renderLoggedInHome(request, response);
  }
  else {
    renderAnonymousHome(request, response);
  }
}

function getBookmarkletInstructions(request, response) {
  var content = bookmarkletTemplate.render({
    host : request.get('host')
  });
  var code = content.
    replace(/\n/g, " ").
    replace(/\s{2,}/g, " ").
    replace(/{\s/g, "{").
    replace(/\s}/g, "}").
    replace(/,\s/g, ",").
    replace(/;\s/g, ";").
    trim();
  var agent = uaparser(request.get('User-Agent'));
  log.debug('User agent: %j', agent);
  var desktop =
    agent.device.type !== 'mobile' &&
    agent.device.type !== 'tablet';
  var mobileSafari =
    agent.device.type === 'mobile' &&
    agent.device.vendor === 'Apple' &&
    agent.browser.name === 'Mobile Safari';
  var mobileChrome =
    (agent.device.type === 'mobile' &&
     agent.browser.name === 'Chrome') ||
    (agent.os.name === 'Android' &&
     (/^Mobile/i).test(agent.browser.name));
  if (!desktop && !mobileSafari && !mobileChrome) {
    desktop = true;
  }
  if (desktop && (mobileSafari || mobileChrome)) {
    desktop = false;
  }
  log.debug('Desktop? %s; Mobile Safari? %s; Mobile Chrome? %s', desktop, mobileSafari, mobileChrome);
  response.render('getting-started/bookmarklet', {
    code : code,
    desktop : desktop,
    mobileSafari : mobileSafari,
    mobileChrome : mobileChrome
  });
}

function getExtensionInstructions(request, response) {
  response.render('getting-started/extension', {
    manifest : extensionInfo
  });
}

function downloadExtension(request, response) {
  response.set('Content-Type', 'application/x-chrome-extension');
  response.download(path.normalize(path.join(__dirname, '../../extension/extension.crx')),
      'tossittome-' + extensionInfo.version + '.crx');
}

function setup(app) {
  app.get('/', auth.protect(false), getHome);
  app.get('/extension', downloadExtension);
  app.get('/getting-started/bookmarklet', auth.protect(), getBookmarkletInstructions);
  app.get('/getting-started/extension', auth.protect(), getExtensionInstructions);
}

module.exports = setup;
