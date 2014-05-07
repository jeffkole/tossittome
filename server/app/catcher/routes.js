var auth     = require('toss/common/auth'),
    db       = require('toss/common/db'),
    log      = require('toss/common/log'),
    catcher  = require('toss/catcher/catcher'),
    userDao  = require('toss/user/dao');

function getNewCatcherRequest(request, response) {
  response.render('new_catcher_request');
}

function postNewCatcherRequest(request, response) {
  if (!request.body.email) {
    response.render('new_catcher_request', {
      error : true
    });
    return;
  }

  var user  = response.locals.user;
  var email = request.body.email;

  var connection = db.getConnection();
  catcher.createNewRequest(connection, user, email, function(error, catcherRequest) {
    if (error) {
      response.send(500, error);
    }
    else {
      response.redirect('/catcher');
    }
    db.closeConnection(connection);
  });
}

function getCatcherRequests(request, response) {
  var user = response.locals.user;

  var connection = db.getConnection();
  catcher.getCatchers(connection, user.token, function(error, catchers) {
    if (error) {
      response.send(500, error);
      db.closeConnection(connection);
    }
    else if (catchers.noTosser) {
      // This should *never* occur, since the user has already been authorized
      response.send(500, 'Invalid user');
      db.closeConnection(connection);
    }
    else if (catchers.noUsers) {
      response.send(500, 'No catchers found');
      db.closeConnection(connection);
    }
    else {
      // `catchers` includes the logged in user
      catcher.getCatcherRequests(connection, user.id, function(error, catcherRequests) {
        if (error) {
          response.send(500, error);
        }
        else if (catcherRequests.noResults) {
          response.render('catcher_requests', {
            hasRequests     : false,
            catchers        : catchers
          });
        }
        else {
          response.render('catcher_requests', {
            hasRequests     : true,
            catchers        : catchers,
            catcherRequests : catcherRequests
          });
        }
        db.closeConnection(connection);
      });
    }
  });
}

function getCatcherResponse(request, response) {
  if (!request.params.token) {
    response.redirect('/catcher');
    return;
  }

  var userId = response.locals.user.id;
  var token  = request.params.token;

  var connection = db.getConnection();
  catcher.getCatcherRequestByToken(connection, token, function(error, catcherRequest) {
    if (error) {
      response.send(500, error);
      db.closeConnection(connection);
    }
    else if (catcherRequest.noResults) {
      response.render('catcher_response', {
        error: {
          noRequest: true
        }
      });
      db.closeConnection(connection);
    }
    else if (catcherRequest.status !== 'open') {
      response.render('catcher_response', {
        error: {
          notOpen: true
        },
        catcherRequest : catcherRequest
      });
      db.closeConnection(connection);
    }
    else {
      userDao.fetchUserById(connection, catcherRequest.requesting_user_id, function(error, user) {
        if (error) {
          response.send(500, error);
        }
        else if (user.noResults) {
          response.send(500, 'Requesting user not found');
        }
        else {
          response.render('catcher_response', {
            hasRequest     : true,
            catcherRequest : catcherRequest,
            requestingUser : user
          });
        }
        db.closeConnection(connection);
      });
    }
  });
}

function postCatcherResponse(request, response) {
  if (!request.params.token) {
    response.redirect('/catcher');
    return;
  }

  if (!request.body.accept &&
      !request.body.reject &&
      !request.body.ignore) {
    log.debug('No action specified in body: %j', request.body);
    response.redirect(request.originalUrl);
    return;
  }

  var userId = response.locals.user.id;
  var token  = request.params.token;
  var state =
    (request.body.accept ? 'accepted' :
     (request.body.reject ? 'rejected' :
      (request.body.ignore ? 'ignored' : undefined)));
  if (state === undefined) {
    throw new Error('Undefined action');
  }

  var connection = db.getConnection();
  connection.beginTransaction(function(error) {
    if (error) {
      response.send(500, error);
      db.closeConnection(connection);
    }
    else {
      catcher.updateCatcherRequest(connection, token, state, userId, function(error, result) {
        if (error) {
          response.send(500, error);
        }
        else if (result.noRequest) {
          response.send(500, 'No request found');
        }
        else {
          response.redirect('/catcher');
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
  app.get('/catcher', auth.protect(), getCatcherRequests);

  app.get('/catcher/new', auth.protect(), getNewCatcherRequest);
  app.post('/catcher/new', auth.protect(), express.bodyParser(), postNewCatcherRequest);

  app.get('/catcher/response/:token', auth.protect(), getCatcherResponse);
  app.post('/catcher/response/:token', auth.protect(), express.bodyParser(), postCatcherResponse);
}

module.exports = setup;
