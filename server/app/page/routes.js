var path    = require('path'),
    uglify  = require('uglify-js'),
    catcher = require('toss/catcher/catcher'),
    auth    = require('toss/common/auth'),
    config  = require('toss/common/config'),
    db      = require('toss/common/db'),
    log     = require('toss/common/log'),
    page    = require('toss/page/page');

var renderCatcherSelectionFn = uglify.minify(path.normalize(path.join(__dirname, '../../views/catcher_selection.js'))).code;
var renderLoginPopupFn = uglify.minify(path.normalize(path.join(__dirname, '../../views/login_popup.js'))).code;

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
  response.render('login_popup_response.js', {
    host               : request.get('host'),
    scriptId           : request.query.s,
    renderLoginPopupFn : renderLoginPopupFn,
    layout             : null
  });
}

function renderCatchSelection(request, response, locals) {
  locals.layout = null;
  locals.renderCatcherSelectionFn = renderCatcherSelectionFn;
  response.setHeader('Content-Type', 'application/javascript');
  response.render('catcher_selection_response.js', locals);
}

// Invoked by the bookmarklet
function initiateToss(request, response) {
  if (!request.cookies.token) {
    log.info('User not logged in. Sending to login');
    renderTossLogin(request, response);
    return;
  }

  var tosserToken = request.cookies.token;
  // Optional query param that will force add some fake catchers (for testing)
  var numCatchers = request.query.c || -1;

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
        catchersJson: JSON.stringify(catchers.map(function(catcher) { return {
          email: catcher.email,
          token: catcher.token
        }; })),
        scriptId: request.query.s,
        forceIframe: request.query.f === 'true'
      });
      db.closeConnection(connection);
    }
  });
}

// Called by the bookmarklet upon choosing a catcher
function completeToss(request, response) {
  // TODO: Have the bookmarklet code catch and handle this
  if (!request.cookies.token) {
    response.send(401, 'Not authorized');
    return;
  }

  if (!request.body.u ||
      !request.body.i ||
      !request.body.c) {
    response.send(400);
    return;
  }

  var tosserToken  = request.cookies.token;
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

function setup(app, express) {
  app.get('/catch', auth.allowOrigin(true), getNextPages);

  app.get('/toss', initiateToss);
  app.post('/toss', express.bodyParser(), auth.allowOrigin(), completeToss);
}

module.exports = setup;
