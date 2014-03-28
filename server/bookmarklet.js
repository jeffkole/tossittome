var engines = require('consolidate');

var config;

function getBookmarklet(request, response) {
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

function setup(app, auth, _config) {
  config = _config;
  app.get('/bookmarklet', auth.protect(), getBookmarklet);
}

module.exports = setup;
