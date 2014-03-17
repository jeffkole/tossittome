var http = require('http'),
    url  = require('url'),
    host = 'localhost',
    port = 9999;

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
  var site = nextSite(user);
  if (site) {
    context.request.resume();
    context.response.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    context.response.write(JSON.stringify(site));
    context.response.end();
    console.log('Notify: Served site [' + site.site + '] for user [' + user + ']');
  }
}

function pause(user, request, response) {
  if (!pending[user]) { pending[user] = []; }

  var context = {
    request: request,
    response: response
  };
  pending[user].push(context);

  request.pause();

  console.log('Paused request for user [' + user + ']');
}

http.createServer(function(request, response) {
  console.log('Request!');
  var params = url.parse(request.url, true).query;
  if (!params || !params.user) {
    response.writeHead(400);
    response.end();
    return;
  }

  var user = params.user;

  if (request.method == 'GET') {
    var site  = nextSite(user);
    if (!site) {
      pause(user, request, response);
    }
    else {
      response.writeHead(200, {
        'Content-Type': 'application/jason',
        'Access-Control-Allow-Origin': '*'
      });
      response.write(JSON.stringify(site));
      response.end();
      console.log('Get: Served site [' + site.site + '] for user [' + user + ']');
    }
  }
  else if (request.method == 'POST') {
    if (!params || !params.site) {
      response.writeHead(400);
      response.end();
      return;
    }

    var site = params.site;

    addSite(user, site);
    notify(user);

    response.writeHead(200, {
      'Content-Type': 'text/plain'
    });
    response.end('OK');
  }
}).listen(port, host);

console.log('Server running at http://' + host + ':' + port);
