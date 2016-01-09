var path    = require('path'),
    uglify  = require('uglify-js'),
    url     = require('url'),
    catcher = require('toss/catcher/catcher'),
    auth    = require('toss/common/auth'),
    config  = require('toss/common/config'),
    db      = require('toss/common/db'),
    log     = require('toss/common/log'),
    page    = require('toss/page/page');

var renderCatcherSelectionFn = uglify.minify(path.normalize(path.join(__dirname, '../../views/catcher_selection.js'))).code;
var renderLoginPopupFn = uglify.minify(path.normalize(path.join(__dirname, '../../views/login_popup.js'))).code;

function isHtml(request) {
  // return (request.accepts(['json', 'html']) === 'html');
  var isHtml = request.query.h === 'true' ||
    (typeof request.body !== 'undefined' && request.body.h === 'true');
  log.debug('isHtml? %s; headers: %j', isHtml, request.headers);
  return isHtml;
}

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
  if (isHtml(request)) {
    var targetUrl = url.format({
      pathname: '/toss',
      query: request.query
    });
    response.redirect('/login?url=' + encodeURIComponent(targetUrl));
    return;
  }

  response.setHeader('Content-Type', 'application/javascript');
  response.render('login_popup_response.js', {
    host               : request.get('host'),
    scriptId           : request.query.s,
    renderLoginPopupFn : renderLoginPopupFn,
    layout             : null
  });
}

function renderCatchSelection(request, response, locals) {
  if (isHtml(request)) {
    // If there is only one catcher, then immediately complete the toss
    if (locals.catchers.length === 1) {
      // This is crazy, and I'm not even sure that it *should* work, but it
      // appears to work.
      request.body = request.body || {};
      request.body.u = locals.url;
      request.body.i = locals.title;
      request.body.c = locals.catchers[0].token;
      request.body.h = true;
      completeToss(request, response);
      return;
    }
    // Select the first catcher, so that there is a default radio button chosen
    locals.catchers[0].checked = true;
    response.render('toss', locals);
    return;
  }

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
        forceIframe: request.query.f === 'true',
        // These locals are for the html view
        catchers: catchers,
        title: request.query.i,
        url: request.query.u
      });
      db.closeConnection(connection);
    }
  });
}

// Called by the bookmarklet upon choosing a catcher
function completeToss(request, response) {
  // TODO: use the auth.protect function instead, right?
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
              if (isHtml(request)) {
                response.redirect(url);
              }
              else {
                response.send(200);
              }
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

function getCatchHistory(request, response) {
  var user = response.locals.user;
  var connection = db.getConnection();
  var start = 0;
  var limit = (request.xhr ? 5 : 20);
  var pageNumber = 1;
  if (request.query.page) {
    pageNumber = parseInt(request.query.page) || 1;
    if (pageNumber <= 0) {
      pageNumber = 1;
    }
    start = limit * (pageNumber - 1);
  }
  page.getCatchHistory(connection, user.id, start, limit, function(error, catches) {
    if (error) {
      response.send(500, error);
    }
    else {
      var locals = {
        noCatches : catches.noResults,
        catches   : catches
      };
      if (request.xhr) {
        locals.layout = null;
        locals.host = request.get('host');
        response.render('extension/catch_history', locals);
      }
      else {
        if (catches.moreResults) {
          locals.nextPage = pageNumber + 1;
          locals.pagination = true;
        }
        if (start > 0) {
          locals.prevPage = pageNumber - 1;
          locals.pagination = true;
        }
        response.render('page/catch_history', locals);
      }
    }
    db.closeConnection(connection);
  });
}

function getTossHistory(request, response) {
  var user = response.locals.user;
  var connection = db.getConnection();
  var start = 0;
  var limit = (request.xhr ? 5 : 20);
  var pageNumber = 1;
  if (request.query.page) {
    pageNumber = parseInt(request.query.page) || 1;
    if (pageNumber <= 0) {
      pageNumber = 1;
    }
    start = limit * (pageNumber - 1);
  }
  page.getTossHistory(connection, user.id, start, limit, function(error, tosses) {
    if (error) {
      response.send(500, error);
    }
    else {
      var locals = {
        noTosses : tosses.noResults,
        tosses   : tosses
      };
      if (tosses.moreResults) {
        locals.nextPage = pageNumber + 1;
        locals.pagination = true;
      }
      if (start > 0) {
        locals.prevPage = pageNumber - 1;
        locals.pagination = true;
      }
      response.render('page/toss_history', locals);
    }
    db.closeConnection(connection);
  });
}

function setup(app, express) {
  app.get('/catch', auth.allowOrigin(true), getNextPages);

  app.get('/toss', auth.protect(false), initiateToss);
  app.post('/toss', express.bodyParser(), auth.allowOrigin(), completeToss);

  app.get('/page/catches', auth.allowOrigin(true), auth.protect(), getCatchHistory);
  app.get('/page/tosses', auth.protect(), getTossHistory);
}

module.exports = setup;
