var catcherDao = require('toss/catcher/dao'),
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

module.exports = {
  getCatchers             : getCatchers,
  checkCatchAuthorization : checkCatchAuthorization
};
