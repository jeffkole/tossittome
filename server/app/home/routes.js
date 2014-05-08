var fs      = require('fs'),
    hogan   = require('hogan.js'),
    path    = require('path'),
    auth    = require('toss/common/auth'),
    db      = require('toss/common/db'),
    page    = require('toss/page/page');

var bookmarkletTemplate =
  hogan.compile(
    fs.readFileSync(
      path.normalize(
        path.join(__dirname, '../../views/getting-started/bookmarklet.js')), { encoding: 'UTF-8' }));

var extensionInfo = require('../../../extension/manifest.json');

function renderLoggedInHome(request, response) {
  var user = response.locals.user;
  var connection = db.getConnection();
  page.getTossHistory(connection, user.id, 5, function(error, tosses) {
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
  response.render('index');
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
  response.render('getting-started/bookmarklet', {
    code : code
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
