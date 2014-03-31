var engines = require('consolidate');

var config;

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
    renderLoggedInHome(request, response);
  }
  else {
    renderAnonymousHome(request, response);
  }
}

function getExtension(request, response) {
  response.set('Content-Type', 'application/x-chrome-extension');
  response.sendfile(__dirname + '/extension/extension.crx');
}

function setup(app, _config) {
  config = _config;
  app.get('/', getHome);
  app.get('/extension.crx', getExtension);
}

module.exports = setup;
