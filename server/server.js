var express = require('express'),
    dao     = require('./dao');

var port      = 9999;

// a hash of usernames to pending requests
var pending = {};

function notify(user) {
  // No records for the user at all
  if (!pending[user]) { return; }

  dao.nextSite(user).
    onSuccess(function(record) {
      var context = pending[user].shift();
      while (context) {
        // Active requests for the user
        if (context.request && context.response) {
          context.request.resume();
          sendSiteResponse(context.response, record);
          console.log('Notify: Served site [%s] for user [%s]', record.site, user);
        }
        context = pending[user].shift();
      }
    }).
    onNoSite(function() {
      // nothing to do if there is no site
    }).
    run();
}

function pause(user, request, response) {
  if (!pending[user]) { pending[user] = []; }

  var context = {
    request:  request,
    response: response
  };
  pending[user].push(context);

  request.connection.setTimeout(60 * 1000);
  request.connection.on('timeout', function() {
    context.request = null;
    context.response = null;
    console.log('Connection timeout');
  });
  request.pause();

  console.log('Paused request for user [%s]', user);
}

function sendSiteResponse(response, record) {
  response.
    set({ 'Access-Control-Allow-Origin': '*' }).
    json(200, record);
}

var app = express();

app.get('/', function(request, response) {
  if (!request.query.user) {
    response.send(400);
    return;
  }

  var user = request.query.user;
  dao.nextSite(user).
    onSuccess(function(record) {
      sendSiteResponse(response, record);
      console.log('Get: Served site [%s] for user [%s]', record.site, user);
    }).
    onNoSite(function() {
      pause(user, request, response);
    }).
    run();
});

app.post('/', function(request, response) {
  if (!request.query.user || !request.query.site) {
    response.send(400);
    return;
  }

  var user = request.query.user;
  var site = request.query.site;

  dao.addSite(user, site).
    onSuccess(function() {
      notify(user);
      response.send(200, 'OK');
    }).
    run();
});

var server = app.listen(port, function() {
  console.log('Listening on port %d', server.address().port);
});
