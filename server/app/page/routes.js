var catcher = require('toss/catcher/catcher'),
    auth    = require('toss/common/auth'),
    config  = require('toss/common/config'),
    db      = require('toss/common/db'),
    log     = require('toss/common/log'),
    minify  = require('toss/page/minify'),
    page    = require('toss/page/page');

// Invoked by the extension
function getNextPages(request, response) {
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

function renderTossLogin(request, response) {
  response.setHeader('Content-Type', 'application/javascript');
  response.render('toss_login.js', {
    host     : request.get('host'),
    scriptId : request.query.s,
    layout   : null
  });
}

function renderCatchSelection(request, response, locals) {
  locals.layout = null;
  response.setHeader('Content-Type', 'application/javascript');
  response.render('catcher_selection.js', locals);
}

// Invoked by the bookmarklet
function initiateToss(request, response) {
  if (!request.cookies.token) {
    log.info('User not logged in. Sending to login');
    renderTossLogin(request, response);
    return;
  }

  if (!request.query.t ||
      !request.query.u ||
      !request.query.i) {
    response.send(400);
    return;
  }

  var tosserToken  = request.query.t;
  var url          = request.query.u;
  var title        = request.query.i;
  // Optional query param that will force add some fake catchers (for testing)
  var numCatchers  = request.query.c || -1;

  if (tosserToken != request.cookies.token) {
    log.info('Mismatched tokens');
    renderTossLogin(request, response);
    return;
  }

  var connection = db.getConnection();
  catcher.getCatchers(connection, tosserToken, function(error, catchers) {
    if (error) {
      response.send(500, error);
      db.closeConnection(connection);
    }
    else if (catchers.noTosser) {
      log.info('No tosser found with token "%s"', tosserToken);
      renderTossLogin(request, response);
      db.closeConnection(connection);
    }
    else {
      if (parseInt(numCatchers) === 1) {
        catchers = [catchers[0]];
        log.debug('With c=%d, set catchers to %j', numCatchers, catchers);
      }
      if (numCatchers > catchers.length) {
        var numToAdd = numCatchers - catchers.length;
        for (var i = 0; i < numToAdd; i++) {
          catchers.push({'token': 'AAAA', 'email': 'foo' + i + '@bar.com'});
        }
        log.debug('With c=%d, set catchers to %j', numCatchers, catchers);
      }

      // Take the tosser to the next step in the process... selecting a catcher
      renderCatchSelection(request, response, {
        host: request.get('host'),
        url: url,
        title: title,
        tosserToken: tosserToken,
        hasCatchers: (catchers.length > 1),
        catchers: catchers,
        scriptId: request.query.s
      });
      db.closeConnection(connection);
    }
  });
}

// Called by the bookmarklet upon choosing a catcher
function completeToss(request, response) {
  if (!request.body.t ||
      !request.body.u ||
      !request.body.i ||
      !request.body.c) {
    response.send(400);
    return;
  }

  var tosserToken  = request.body.t;
  var url          = request.body.u;
  var title        = request.body.i;
  var catcherToken = request.body.c;

  var connection = db.getConnection();
  catcher.checkCatchAuthorization(connection, tosserToken, catcherToken, function(error, catchers) {
    if (error) {
      response.send(500, error);
      db.closeConnection(connection);
    }
    else if (catchers.noTosser || catchers.noCatcher) {
      response.send(400, 'Bad request');
      db.closeConnection(connection);
    }
    else if (catchers.notAuthorized) {
      response.send(401, 'Not authorized');
      db.closeConnection(connection);
    }
    else {
      connection.beginTransaction(function(error) {
        if (error) {
          response.send(500, error);
          db.closeConnection(connection);
        }
        else {
          page.addPage(connection, tosserToken, catcherToken, url, title, function(error, page) {
            if (error) {
              response.send(500, error);
            }
            else if (page.noResults) {
              response.send(400);
            }
            else {
              response.send(200);
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
  });
}

// TODO: add ability to choose a catcher
function getAddPage(request, response) {
  response.render('add', {
    url   : request.query.url,
    title : request.query.title
  });
}

// TODO: add ability to choose a catcher
function postAddPage(request, response) {
  if (!request.body.url || !request.body.title) {
    response.send(400);
    return;
  }

  var tosserToken  = request.cookies.token;
  var url          = request.body.url;
  var title        = request.body.title;
  // For backwards compatibility, just use the tosser as the catcher
  var catcherToken = request.body.catcherToken || tosserToken;

  var connection = db.getConnection();
  connection.beginTransaction(function(error) {
    if (error) {
      response.send(500, error);
      db.closeConnection(connection);
    }
    else {
      page.addPage(connection, tosserToken, catcherToken, url, title, function(error, page) {
        if (error) {
          response.send(500, error);
        }
        else if (page.noResults) {
          response.send(400);
        }
        else {
          response.redirect(url);
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

function setup(app, express) {
  app.get('/catch', auth.allowOrigin(true), getNextPages);

  app.get('/toss', minify.minify(), initiateToss);
  app.post('/toss', express.bodyParser(), auth.allowOrigin(), completeToss);

  app.get('/add', auth.protect(), auth.populateUser(), getAddPage);
  app.post('/add', express.bodyParser(), auth.protect(), auth.populateUser(), postAddPage);
}

module.exports = setup;
