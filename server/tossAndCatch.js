var config;
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

// Invoked by the extension
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

// Invoked by the bookmarklet
function tosser(request, response) {
  if (!request.cookies.token) {
    console.log('User not logged in. Sending to login');
    response.render('toss_login.js', {
      host: config.host
    });
    return;
  }

  if (!request.query.t || !request.query.s) {
    response.send(400);
    return;
  }

  var token = request.query.t;
  var site  = request.query.s;

  if (token != request.cookies.token) {
    console.log('Mismatched tokens');
    response.render('toss_login.js', {
      host: config.host
    });
    return;
  }

  dao.addSite(token, site).
    onSuccess(function() {
      notify(token);
      response.set('Content-Type', 'text/javascript');
      response.sendfile('public/toss_response.js');
    }).
    run();
}

function getAddPage(request, response) {
  response.render('add', {
    page: request.query.page
  });
}

function postAddPage(request, response) {
  if (!request.body.page) {
    response.send(400);
    return;
  }

  var token = request.cookies.token;
  var page  = request.body.page;

  dao.addSite(token, page).
    onSuccess(function() {
      notify(token);
      response.redirect(page);
    }).
    run();
}

function setup(app, _config, _dao) {
  config = _config;
  dao = _dao;
  app.get('/catch', catcher);
  app.get('/toss', tosser);
  app.get('/add', getAddPage);
  app.post('/add', postAddPage);
}

module.exports = setup;
