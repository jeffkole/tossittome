var catcherDao = require('toss/catcher/dao'),
    token      = require('toss/common/token'),
    sender     = require('toss/email/sender'),
    userDao    = require('toss/user/dao');

function getCatchers(connection, tosserToken, cb) {
  userDao.fetchUserByToken(connection, tosserToken, function(error, tosser) {
    if (error) {
      return cb(error);
    }
    if (tosser.noResults) {
      return cb(null, { noTosser: true });
    }
    catcherDao.fetchCatchersByTosser(connection, tosser.id, function(error, catchers) {
      if (error) {
        return cb(error);
      }
      // If there are no authorized catchers, then just return the tosser
      if (catchers.noResults) {
        return cb(null, [tosser]);
      }
      var catcherIds = catchers.map(function(c) { return c.catcher_id; });
      userDao.fetchUserById(connection, catcherIds, function(error, users) {
        if (error) {
          return cb(error);
        }
        if (users.noResults) {
          return cb(null, { noUsers: true });
        }
        // Add the tosser to the front of the return list
        var allUsers = new Array(tosser);
        allUsers = allUsers.concat(users);
        return cb(null, allUsers);
      });
    });
  });
}

function checkCatchAuthorization(connection, tosserToken, catcherToken, cb) {
  if (tosserToken === catcherToken) {
    return cb(null, { selfAuthorization: true });
  }
  userDao.fetchUserByToken(connection, tosserToken, function(error, tosser) {
    if (error) {
      return cb(error);
    }
    if (tosser.noResults) {
      return cb(null, { noTosser: true });
    }
    userDao.fetchUserByToken(connection, catcherToken, function(error, catcher) {
      if (error) {
        return cb(error);
      }
      if (catcher.noResults) {
        return cb(null, { noCatcher: true });
      }
      catcherDao.fetchCatch(connection, tosser.id, catcher.id, function(error, catchers) {
        if (error) {
          return cb(error);
        }
        if (catchers.noResults) {
          return cb(null, { notAuthorized: true });
        }
        return cb(null, catchers);
      });
    });
  });
}

function createNewRequest(connection, requestingUser, catcherEmail, cb) {
  var requestToken = token.generate(requestingUser.id, catcherEmail);
  catcherDao.insertCatcherRequest(connection, requestToken, requestingUser.id, catcherEmail, function(error, request) {
    if (error) {
      return cb(error);
    }
    // TODO: emit request event
    var responseUri = '/catcher/response/' + requestToken;
    sender.sendCatcherRequest(catcherEmail, requestingUser, responseUri, function(error, result) {
      if (error) {
        return cb(error);
      }
      return cb(null, request);
    });
  });
}

function getCatcherRequests(connection, requestingUserId, cb) {
  catcherDao.fetchCatcherRequestsByRequestingUser(connection, requestingUserId, function(error, requests) {
    if (error) {
      return cb(error);
    }
    if (requests.noResults) {
      return cb(null, { noResults: true });
    }
    return cb(null, requests);
  });
}

function getCatcherRequestByToken(connection, token, cb) {
  catcherDao.fetchCatcherRequestByToken(connection, token, function(error, request) {
    if (error) {
      return cb(error);
    }
    if (request.noResults) {
      return cb(null, { noResults: true });
    }
    return cb(null, request);
  });
}

function updateCatcherRequest(connection, token, state, catcherId, cb) {
  if (state !== 'accepted' &&
      state !== 'rejected' &&
      state !== 'ignored') {
    return cb(new Error('Unknown state: ' + state));
  }

  catcherDao.fetchCatcherRequestByToken(connection, token, function(error, request) {
    if (error) {
      return cb(error);
    }
    if (request.noResults) {
      return cb(null, { noRequest: true });
    }
    // If the request was accepted, then add the catchers, which are always reciprocal.
    if (state === 'accepted') {
      catcherDao.insertCatcher(connection, request.requesting_user_id, catcherId, function(error, result) {
        if (error) {
          return cb(error);
        }
        catcherDao.insertCatcher(connection, catcherId, request.requesting_user_id, function(error, result) {
          if (error) {
            return cb(error);
          }
          catcherDao.updateCatcherRequest(connection, request.id, state, function(error, result) {
            if (error) {
              return cb(error);
            }
            return cb(null, result);
          });
        });
      });
    }
    else {
      catcherDao.updateCatcherRequest(connection, request.id, state, function(error, result) {
        if (error) {
          return cb(error);
        }
        return cb(null, result);
      });
    }
  });
}

module.exports = {
  getCatchers              : getCatchers,
  checkCatchAuthorization  : checkCatchAuthorization,
  createNewRequest         : createNewRequest,
  getCatcherRequests       : getCatcherRequests,
  getCatcherRequestByToken : getCatcherRequestByToken,
  updateCatcherRequest     : updateCatcherRequest
};
