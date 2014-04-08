var config = require('toss/common/config'),
    db     = require('toss/common/db'),
    log    = require('toss/common/log'),
    page   = require('toss/page/page');

// Invoked by the extension
function catcher(request, response) {
  if (!request.cookies.token) {
    response.send(401, 'Not authorized');
    return;
  }

  var token = request.cookies.token;
  var connection = db.getConnection();
  connection.beginTransaction(function(error) {
    if (error) {
      response.send(500, error);
      db.closeConnection(connection);
    }
    else {
      page.getNextPages(connection, token, function(error, pages) {
        if (error) {
          response.send(500, error);
        }
        else if (pages.noResults) {
          response.json(200, { noCatches: true });
        }
        else {
          response.json(200, pages);
          log.info('Get: Served pages %j for token [%s]', pages.map(function(r) { return r.id; }), token);
        }
        connection.commit(function(error) {
          db.closeConnection(connection, function() {
            if (error) {
              throw error;
            }
          });
        });
      });
    }
  });
}

// Invoked by the bookmarklet
function tosser(request, response) {
  if (!request.cookies.token) {
    log.info('User not logged in. Sending to login');
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
    log.info('Mismatched tokens');
    response.render('toss_login.js', {
      host: config.host,
      layout: null
    });
    return;
  }

  var connection = db.getConnection();
  page.addPage(connection, token, url, title, function(error, page) {
    if (error) {
      response.send(500, error);
    }
    else if (page.noResults) {
      response.send(400);
    }
    else {
      response.render('toss_response.js', {
        layout: null
      });
    }
    db.closeConnection(connection);
  });
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

  var connection = db.getConnection();
  page.addPage(connection, token, url, title, function(error, page) {
    if (error) {
      response.send(500, error);
    }
    else if (page.noResults) {
      response.send(400);
    }
    else {
      response.redirect(url);
    }
    db.closeConnection(connection);
  });
}

function setup(app, express, auth) {
  app.get('/catch', auth.allowOrigin(), catcher);
  app.get('/toss', tosser);
  app.get('/add', auth.protect(), getAddPage);
  app.post('/add', express.bodyParser(), auth.protect(), postAddPage);
}

module.exports = setup;
