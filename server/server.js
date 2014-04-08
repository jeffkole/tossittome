var express = require('express'),
    fs      = require('fs'),
    hogan   = require('hogan-express'),
    path    = require('path'),
    auth    = require('toss/common/auth'),
    config  = require('toss/common/config'),
    log     = require('toss/common/log');

var app = express();

app.use(express.static(__dirname + '/public'));
app.use(express.cookieParser());
express.logger.token('remote-addr', function(request) {
  // Add access to X-Real-IP for proxied apps as the first option
  if (request.get('X-Real-IP')) return request.get('X-Real-IP');
  // Below is copied from connect/lib/middleware/logger.js
  if (request.ip) return request.ip;
  if (request._remoteAddress) return request._remoteAddress;
  var sock = request.socket;
  if (sock.socket) return sock.socket.remoteAddress;
  return sock.remoteAddress;
});
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
if (fs.existsSync(partialsDir)) {
  var partials = {};
  fs.readdirSync(partialsDir).forEach(function(partial) {
    var name = path.basename(partial, path.extname(partial));
    partials[name] = 'partials/' + partial;
  });
  app.set('partials', partials); // { head: 'partials/head.html' });
}
// Set the default layout
app.set('layout', 'layouts/default.html');

require('toss/home/routes')(app);
require('toss/user/routes')(app, express, auth);
require('toss/page/routes')(app, express, auth);

var server = app.listen(config.port, function() {
  log.info('Listening on port %d', server.address().port);
});
