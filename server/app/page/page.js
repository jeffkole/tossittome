var _       = require('underscore'),
    pageDao = require('toss/page/dao'),
    userDao = require('toss/user/dao');

function populateTossersAndCatchers(connection, pages, cb) {
  var userIds = _.chain(pages)
    .map(function(page) { return [ page.tosser_id, page.catcher_id ]; })
    .flatten()
    .uniq()
    .value();
  // Fill the page tosser property with the user data about the tossers
  userDao.fetchUserById(connection, userIds, function(error, users) {
    if (error) {
      return cb(error);
    }
    if (users.noResults) {
      return cb(null, { noResults: true });
    }
    // Treat the results like an array even if it is just a single object
    if (userIds.length === 1) {
      users = [users];
    }
    var userIdMap = {};
    users.forEach(function(user) {
      userIdMap[user.id] = user;
    });
    pages.forEach(function(page) {
      page.tosser  = userIdMap[page.tosser_id];
      page.catcher = userIdMap[page.catcher_id];
      // Can't use `served_at` as a section with a lambda call inside it, so add
      // a new field called `served` to use.
      if (page.served_at) {
        page.served = true;
      }
      else {
        page.served = false;
      }
    });
    return cb(null, pages);
  });
}

function addPage(connection, tosserToken, catcherToken, url, title, cb) {
  userDao.fetchUserByToken(connection, tosserToken, function(error, tosser) {
    if (error) {
      return cb(error);
    }
    if (tosser.noResults) {
      return cb(null, { noResults: true });
    }
    userDao.fetchUserByToken(connection, catcherToken, function(error, catcher) {
      if (error) {
        return cb(error);
      }
      if (catcher.noResults) {
        return cb(null, { noResults: true });
      }
      pageDao.insertPage(connection, tosser.id, catcher.id, url, title, function(error, page) {
        if (error) {
          return cb(error);
        }
        return cb(null, page);
      });
    });
  });
}

function getNextPages(connection, token, cb) {
  userDao.fetchUserByToken(connection, token, function(error, user) {
    if (error) {
      return cb(error);
    }
    if (user.noResults) {
      return cb(null, { noResults: true });
    }
    pageDao.fetchNextPages(connection, user.id, function(error, pages) {
      if (error) {
        return cb(error);
      }
      if (pages.noResults) {
        return cb(null, { noResults: true });
      }
      return populateTossersAndCatchers(connection, pages, cb);
    });
  });
}

function getTossHistory(connection, userId, start, limit, cb) {
  if (arguments.length === 3) {
    if (typeof start !== 'function') {
      throw new Error('Last argument must be a function');
    }
    cb = start;
    start = null;
    limit = null;
  }
  pageDao.fetchTossHistory(connection, userId, start, (limit ? limit + 1 : null), function(error, pages) {
    if (error) {
      return cb(error);
    }
    if (pages.noResults) {
      return cb(null, { noResults: true });
    }
    if (limit && pages.length > limit) {
      pages = pages.slice(0, limit);
      pages.moreResults = true;
    }
    return populateTossersAndCatchers(connection, pages, cb);
  });
}

function getCatchHistory(connection, userId, start, limit, cb) {
  if (arguments.length === 3) {
    if (typeof start !== 'function') {
      throw new Error('Last argument must be a function');
    }
    cb = start;
    start = null;
    limit = null;
  }
  // Fetch one more than desired as an indicator that there might be more results
  pageDao.fetchCatchHistory(connection, userId, start, (limit ? limit + 1 : null), function(error, pages) {
    if (error) {
      return cb(error);
    }
    if (pages.noResults) {
      return cb(null, { noResults: true });
    }
    if (limit && pages.length > limit) {
      pages = pages.slice(0, limit);
      pages.moreResults = true;
    }
    return populateTossersAndCatchers(connection, pages, cb);
  });
}

module.exports = {
  addPage         : addPage,
  getNextPages    : getNextPages,
  getTossHistory  : getTossHistory,
  getCatchHistory : getCatchHistory
};
