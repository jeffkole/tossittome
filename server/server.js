var express = require('express'),
    engines = require('consolidate'),
    crypto  = require('crypto'),
    base64  = require('js-base64').Base64,
    dao     = require('./dao');

var port      = 9999;

// a hash of tokens to pending requests
var pending = {};

function notify(token) {
  // No records for the token at all
  if (!pending[token]) { return; }

  dao.nextSite(token).
    onSuccess(function(record) {
      var context = pending[token].shift();
      while (context) {
        // Active requests for the token
        if (context.request && context.response) {
          context.request.resume();
          sendSiteResponse(context.response, record);
          console.log('Notify: Served site [%s] for token [%s]', record.site, token);
        }
        context = pending[token].shift();
      }
    }).
    onNoSite(function() {
      // nothing to do if there is no site
    }).
    run();
}

function pause(token, request, response) {
  if (!pending[token]) { pending[token] = []; }

  var context = {
    request:  request,
    response: response
  };
  pending[token].push(context);

  request.connection.setTimeout(60 * 1000);
  request.connection.on('timeout', function() {
    context.request = null;
    context.response = null;
    console.log('Connection timeout');
  });
  request.pause();

  console.log('Paused request for token [%s]', token);
}

function sendSiteResponse(response, record) {
  response.
    set({ 'Access-Control-Allow-Origin': '*' }).
    json(200, record);
}

function validatePassword(plain, hashed) {
  return hashPassword(plain, hashed.substring(0, 3)) == hashed;
}

function hashPassword(plain, salt) {
  if (arguments.length == 1) {
    salt = base64.encodeURI(crypto.randomBytes(2));
  }
  var hashed =
    base64.encode(
        crypto.createHash('sha1').
        update(salt).
        update(plain).
        digest('binary'));
  return (salt + hashed);
}

function login(email, password, response) {
  var failureFn = function() {
    response.send(400);
  };

  dao.fetchUserByEmail(email).
    onSuccess(function(user) {
      if (validatePassword(password, user.password)) {
        response.cookie('token', user.token);
        response.redirect('/bookmarklet');
      }
      else {
        console.log('Invalid password: %s', password);
        failureFn();
      }
    }).
    onFailure(failureFn).
    run();
}

var app = express();

app.use(express.static(__dirname + '/public'));
app.use(express.bodyParser());
app.use(express.cookieParser());

// assign the hogan engine to .html and files
app.engine('html', engines.hogan);

// set .html as the default extension
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

if ('development' == app.get('env')) {
  app.set('host', 'localhost:9999');
}
if ('production' == app.get('env')) {
  app.set('host', 'tossitto.me');
}

app.get('/', function(request, response) {
  response.render('index', {
    name: 'World'
  });
});

app.get('/login', function(request, response) {
  response.render('login');
});

app.post('/login', function(request, response) {
  console.log('Attempted login with %j', request.body);
  if (!request.body.email || !request.body.password) {
    response.send(400);
    return;
  }

  var email    = request.body.email;
  var password = request.body.password;

  login(email, password, response);
});

app.get('/logout', function(request, response) {
  response.clearCookie('token');
  response.redirect('/');
});

app.get('/bookmarklet', function(request, response) {
  if (!request.cookies.token) {
    response.redirect('/');
    return;
  }

  engines.hogan(__dirname + '/views/bookmarklet.js', {
      host  : app.get('host'),
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
});

app.get('/catch', function(request, response) {
  if (!request.query.token) {
    response.send(400);
    return;
  }

  var token = request.query.token;
  dao.nextSite(token).
    onSuccess(function(record) {
      sendSiteResponse(response, record);
      console.log('Get: Served site [%s] for token [%s]', record.site, token);
    }).
    onNoSite(function() {
      pause(token, request, response);
    }).
    run();
});

app.get('/toss', function(request, response) {
  if (!request.query.t || !request.query.s) {
    response.send(400);
    return;
  }

  var token = request.query.t;
  var site  = request.query.s;

  dao.addSite(token, site).
    onSuccess(function() {
      notify(token);
      response.set('Content-Type', 'text/javascript');
      response.sendfile('public/toss_response.js');
    }).
    run();
});

app.get('/register', function(request, response) {
  response.render('register');
});

app.post('/register', function(request, response) {
  if (!request.body.email || !request.body.password) {
    response.send(400);
    return;
  }

  var email    = request.body.email;
  var password = request.body.password;

  dao.addUser(email, hashPassword(password)).
    onSuccess(function(user) {
      response.cookie('token', user.token);
      response.redirect('/bookmarklet');
    }).
    run();
});

var server = app.listen(port, function() {
  console.log('Listening on port %d', server.address().port);
});
