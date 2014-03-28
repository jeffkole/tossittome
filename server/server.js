var express = require('express'),
    engines = require('consolidate'),
    dao     = require('./dao'),
    auth    = require('./auth');

var port      = 9999;

var app = express();

var config = require('./config')(app);
dao.setConfig(config);

app.use(express.static(__dirname + '/public'));
app.use(express.cookieParser());
app.use(express.logger());

// assign the hogan engine to .html and .js files
app.engine('html', engines.hogan);
app.engine('js',   engines.hogan);

// set .html as the default extension
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

app.get('/', function(request, response) {
  if (request.cookies.token) {
    response.redirect('/bookmarklet');
  }
  else {
    response.render('index');
  }
});

require('./user')(app, express, dao);
require('./tossAndCatch')(app, express, auth, config, dao);
require('./bookmarklet')(app, auth, config);

var server = app.listen(port, function() {
  console.log('Listening on port %d', server.address().port);
});
