var pageDao = require('toss/page/dao'),
    userDao = require('toss/user/dao');

function addPage(connection, token, url, title, cb) {
  userDao.fetchUserByToken(connection, token, function(error, user) {
    if (error) {
      return cb(error);
    }
    if (user.noResults) {
      return cb(null, { noResults: true });
    }
    pageDao.insertPage(connection, user.id, url, title, function(error, page) {
      if (error) {
        return cb(error);
      }
      else {
        return cb(null, page);
      }
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
