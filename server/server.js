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
  console.log('Added site [%s] for user [%s]', site, user);
}

function nextSite(user) {
  if (!sites[user]) { return null; }
  return sites[user].shift();
}

function notify(user) {
  // No records for the user at all
  if (!pending[user]) { return; }

  var site = nextSite(user);
  if (site) {
    var context = pending[user].shift();
    while (context) {
      // Active requests for the user
      if (context.request && context.response) {
        context.request.resume();
        sendSiteResponse(context.response, site);
        console.log('Notify: Served site [%s] for user [%s]', site.site, user);
      }
      context = pending[user].shift();
    }
  }
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

function sendSiteResponse(response, site) {
  response.
    set({ 'Access-Control-Allow-Origin': '*' }).
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
    console.log('Get: Served site [%s] for user [%s]', site.site, user);
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
