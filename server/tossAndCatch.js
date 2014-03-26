var dao;

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

function catcher(request, response) {
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
}

function tosser(request, response) {
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
}

function setup(app, _dao) {
  dao = _dao;
  app.get('/catch', catcher);
  app.get('/toss', tosser);
}

module.exports = setup;
