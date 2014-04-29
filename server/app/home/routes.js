var fs      = require('fs'),
    hogan   = require('hogan.js'),
    path    = require('path'),
    auth    = require('toss/common/auth'),
    config  = require('toss/common/config'),
    db      = require('toss/common/db'),
    userDao = require('toss/user/dao');

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
  if (request.cookies.token) {
    var connection = db.getConnection();
    userDao.fetchUserByToken(connection, request.cookies.token, function(error, user) {
      if (error) {
        response.send(500, error);
      }
      else if (user.noResults) {
        // Clear the fraudulent cookie
        response.clearCookie('token');
        renderAnonymousHome(request, response);
      }
      else {
        renderLoggedInHome(request, response);
      }
      db.closeConnection(connection);
    });
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
  app.get('/', auth.populateUser(), getHome);
  app.get('/extension', getExtension);
}

module.exports = setup;
