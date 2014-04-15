var pageDao = require('toss/page/dao'),
    userDao = require('toss/user/dao');

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
      return cb(null, pages);
    });
  });
}

module.exports = {
  addPage      : addPage,
  getNextPages : getNextPages
};
