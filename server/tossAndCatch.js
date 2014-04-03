var config;
var dao;

// a hash of tokens to pending requests
var pending = {};

function notify(token) {
  // No records for the token at all
  if (!pending[token]) { return; }

  dao.nextPage(token).
    onSuccess(function(records) {
      var context = pending[token].shift();
      // TODO: even if there are no active contexts, the db record is marked as
      // served.  FIXME!
      while (context) {
        // Active requests for the token
        if (context.request && context.response) {
          context.request.resume();
          context.response.json(200, records);
          console.log('Notify: Served pages %j for token [%s]', records.map(function(r) { return r.id; }), token);
        }
        context = pending[token].shift();
      }
    }).
    onNoPage(function() {
      // nothing to do if there is no page
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

// Invoked by the extension
function catcher(request, response) {
  if (!request.cookies.token) {
    response.send(401, 'Not authorized');
    return;
  }

  var token = request.cookies.token;
  dao.nextPage(token).
    onSuccess(function(records) {
      response.json(200, records);
      console.log('Get: Served pages %j for token [%s]', records.map(function(r) { return r.id; }), token);
    }).
    onNoPage(function() {
      // pause(token, request, response);
      response.json(200, { noCatches: true });
    }).
    run();
}

// Invoked by the bookmarklet
function tosser(request, response) {
  if (!request.cookies.token) {
    console.log('User not logged in. Sending to login');
    response.render('toss_login.js', {
      host: config.host,
      layout: null
    });
    return;
  }

  if (!request.query.t ||
      !request.query.u ||
      !request.query.i) {
    response.send(400);
    return;
  }

  var token = request.query.t;
  var url   = request.query.u;
  var title = request.query.i;

  if (token != request.cookies.token) {
    console.log('Mismatched tokens');
    response.render('toss_login.js', {
      host: config.host,
      layout: null
    });
    return;
  }

  dao.addPage(token, url, title).
    onSuccess(function() {
      // notify(token);
      response.set('Content-Type', 'text/javascript');
      response.sendfile(__dirname + '/public/toss_response.js');
    }).
    run();
}

function getAddPage(request, response) {
  response.render('add', {
    url   : request.query.url,
    title : request.query.title
  });
}

function postAddPage(request, response) {
  if (!request.body.url || !request.body.title) {
    response.send(400);
    return;
  }

  var token = request.cookies.token;
  var url   = request.body.url;
  var title = request.body.title;

  dao.addPage(token, url, title).
    onSuccess(function() {
      // notify(token);
      response.redirect(url);
    }).
    run();
}

function setup(app, express, auth, _config, _dao) {
  config = _config;
  dao = _dao;
  app.get('/catch', auth.allowOrigin(), catcher);
  app.get('/toss', tosser);
  app.get('/add', auth.protect(), getAddPage);
  app.post('/add', express.bodyParser(), auth.protect(), postAddPage);
}

module.exports = setup;
