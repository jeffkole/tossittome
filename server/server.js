var express = require('express');

var app = express();
var port = 9999;
// a hash of usernames to sites (ie, our database)
var sites = {};
// a hash of usernames to pending requests
var pending = {};

function addSite(user, site) {
  if (!sites[user]) { sites[user] = []; }

  sites[user].push({site: site});
  console.log('Added site [' + site + '] for user [' + user + ']');
}

function nextSite(user) {
  if (!sites[user]) { return null; }
  return sites[user].shift();
}

function notify(user) {
  if (!pending[user]) { return; }

  var context = pending[user].shift();
  if (context.request && context.response) {
    var site = nextSite(user);
    if (site) {
      context.request.resume();
      sendSiteResponse(context.response, site);
      console.log('Notify: Served site [' + site.site + '] for user [' + user + ']');
    }
  }
  else {
    // If there were not valid requests and responses, then try again in case we
    // encountered a connection that timed out.
    notify(user);
  }
}

function pause(user, request, response) {
  if (!pending[user]) { pending[user] = []; }

  var context = {
    request: request,
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

  console.log('Paused request for user [' + user + ']');
}

function sendSiteResponse(response, site) {
  response.
    set({
      'Access-Control-Allow-Origin': '*'
    }).
    json(200, site);
}

app.get('/', function(request, response) {
  if (!request.query.user) {
    response.send(400);
    return;
  }

  var user = request.query.user;
  var site = nextSite(user);
  if (!site) {
    pause(user, request, response);
  }
  else {
    sendSiteResponse(response, site);
    console.log('Get: Served site [' + site.site + '] for user [' + user + ']');
  }
});

app.post('/', function(request, response) {
  if (!request.query.user || !request.query.site) {
    response.send(400);
    return;
  }

  var user = request.query.user;
  var site = request.query.site;

  addSite(user, site);
  notify(user);

  response.send(200, 'OK');
});

var server = app.listen(port, function() {
  console.log('Listening on port %d', server.address().port);
});
