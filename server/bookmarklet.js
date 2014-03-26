var engines = require('consolidate');

var config;

function getBookmarklet(request, response) {
  if (!request.cookies.token) {
    response.redirect('/');
    return;
  }

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

function setup(app, _config) {
  config = _config;
  app.get('/bookmarklet', getBookmarklet);
}

module.exports = setup;
