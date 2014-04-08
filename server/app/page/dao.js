var log = require('toss/common/log');

function insertPage(connection, userId, url, title, cb) {
  connection.query(
      'insert into pages (user_id, url, title) values (?, ?, ?)',
      [userId, url, title],
      function(error, results) {
        if (error) {
          cb(error);
        }
        else {
          cb(null, { id: results.insertId });
        }
      });
}

function fetchNextPages(connection, userId, cb) {
  connection.query(
      'select id, url, title from pages where user_id=? and served_at is null order by created_at for update',
      userId,
      function(error, pages) {
        if (error) {
          return cb(error);
        }
        if (pages.length <= 0) {
          return cb(null, { noResults: true });
        }

        log.info('Next records for user [%s] are [%j]', userId, pages);
        var ids = pages.map(function(r) { return r.id; });
        var qqs = '?';
        for (var i = 1; i < ids.length; i++) {
          qqs += ',?';
        }
        connection.query(
            'update pages set served_at=now() where id in (' + qqs + ')',
            ids,
            function(error, results) {
              if (error) {
                return cb(error);
              }
              log.info('Recorded serving for rows %j', ids);
              return cb(null, pages);
            });
      });
}

module.exports = {
  insertPage     : insertPage,
  fetchNextPages : fetchNextPages
};
