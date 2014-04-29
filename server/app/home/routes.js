var fs      = require('fs'),
    hogan   = require('hogan.js'),
    path    = require('path'),
    auth    = require('toss/common/auth');

var bookmarkletTemplate =
  hogan.compile(fs.readFileSync(path.normalize(path.join(__dirname, '../../views/bookmarklet.js')), { encoding: 'UTF-8' }));

var extensionInfo = require('../../../extension/manifest.json');

function renderLoggedInHome(request, response) {
  var content = bookmarkletTemplate.render({
    host  : request.get('host')
  });
  var code = content.
    replace(/\n/g, " ").
    replace(/\s{2,}/g, " ").
    replace(/{\s/g, "{").
    replace(/\s}/g, "}").
    replace(/,\s/g, ",").
    replace(/;\s/g, ";").
    trim();
  response.render('bookmarklet', {
    code: code,
    manifest: extensionInfo
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

function getExtension(request, response) {
  response.set('Content-Type', 'application/x-chrome-extension');
  response.download(path.normalize(path.join(__dirname, '../../extension/extension.crx')),
      'tossittome-' + extensionInfo.version + '.crx');
}

function setup(app) {
  app.get('/', auth.protect(false), getHome);
  app.get('/extension', getExtension);
}

module.exports = setup;
