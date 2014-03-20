var express = require('express'),
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

var app = express();

app.use(express.static(__dirname + '/public'));

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

app.post('/u', function(request, response) {
  if (!request.query.email) {
    response.send(400);
    return;
  }

  var email = request.query.email;
  dao.addUser(email).
    onSuccess(function() {
      response.send(200, 'OK');
    }).
    run();
});

var server = app.listen(port, function() {
  console.log('Listening on port %d', server.address().port);
});
