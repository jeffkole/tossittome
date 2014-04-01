var engines = require('consolidate');

var config;
var dao;

function renderLoggedInHome(request, response) {
  engines.hogan(__dirname + '/views/bookmarklet.js', {
      host  : config.host,
      token : request.cookies.token
    },
    function(error, content) {
      if (error) { throw error; }
      var code = content.
        replace(/\n/g, " ").
        replace(/\s{2,}/g, " ").
        replace(/{\s/g, "{").
        replace(/\s}/g, "}").
        replace(/,\s/g, ",").
        replace(/;\s/g, ";");
      response.render('bookmarklet', {
        code: code
      });
    });
}

function renderAnonymousHome(request, response) {
  response.render('index');
}

function getHome(request, response) {
  if (request.cookies.token) {
    dao.fetchUserByToken(request.cookies.token).
      onSuccess(function(user) {
        renderLoggedInHome(request, response);
      }).
      onFailure(function() {
        // Clear the fraudulent cookie
        response.clearCookie('token');
        renderAnonymousHome(request, response);
      }).
      run();
  }
  else {
    renderAnonymousHome(request, response);
  }
}

function getExtension(request, response) {
  response.set('Content-Type', 'application/x-chrome-extension');
  response.download(__dirname + '/extension/extension.crx', 'tossittome.crx');
}

function setup(app, _config, _dao) {
  config = _config;
  dao = _dao;
  app.get('/', getHome);
  app.get('/extension.crx', getExtension);
}

module.exports = setup;
