var express = require('express'),
    engines = require('consolidate'),
    dao     = require('./dao');

var port      = 9999;

var app = express();

var config = require('./config')(app);
dao.setConfig(config);

app.use(express.static(__dirname + '/public'));
app.use(express.bodyParser());
app.use(express.cookieParser());

// assign the hogan engine to .html and files
app.engine('html', engines.hogan);

// set .html as the default extension
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

app.get('/', function(request, response) {
  response.render('index', {
    name: 'World'
  });
});

require('./user')(app, dao);
require('./tossAndCatch')(app, dao);
require('./bookmarklet')(app, config);

var server = app.listen(port, function() {
  console.log('Listening on port %d', server.address().port);
});
