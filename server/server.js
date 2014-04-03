var express = require('express'),
    fs      = require('fs'),
    hogan   = require('hogan-express'),
    path    = require('path'),
    dao     = require('./dao'),
    auth    = require('./auth');

var app = express();

var config = require('./config')(app);
dao.setConfig(config);

app.use(express.static(__dirname + '/public'));
app.use(express.cookieParser());
app.use(express.logger());

// assign the hogan engine to .html and .js files
app.engine('html', hogan);
app.engine('js',   hogan);

// set .html as the default extension
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
// Note: Partials and layout are shared across both instances of the hogan
// engine, so use the extension so there are not conflicts during resolution.
// For js templates, set the layout to null so that the default layout is not
// used.
//
// Read in all the partials
var partialsDir = __dirname + '/views/partials';
if (fs.exists(partialsDir)) {
  var partials = {};
  fs.readdirSync(partialsDir).forEach(function(partial) {
    var name = path.basename(partial, path.extname(partial));
    partials[name] = 'partials/' + partial;
  });
  app.set('partials', partials); // { head: 'partials/head.html' });
}
// Set the default layout
app.set('layout', 'layouts/default.html');

require('./home')(app, config, dao);
require('./user')(app, express, auth, dao);
require('./tossAndCatch')(app, express, auth, config, dao);

var server = app.listen(config.port, function() {
  console.log('Listening on port %d', server.address().port);
});
