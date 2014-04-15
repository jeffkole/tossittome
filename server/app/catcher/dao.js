function insertCatcher(connection, tosserId, catcherId, cb) {
  connection.query(
      'insert into catchers (tosser_id, catcher_id) ' +
      'select ?, ? from dual where not exists (select 1 from catchers where tosser_id=? and catcher_id=?)',
      [tosserId, catcherId, tosserId, catcherId],
      function(error, results) {
        if (error) {
          return cb(error);
        }
        if (results.affectedRows === 0) {
          return cb(null, { duplicateCatcher: true });
        }
        return cb(null, { id: results.insertId });
      });
}

function fetchCatchersByTosser(connection, tosserId, cb) {
  connection.query(
      'select id, tosser_id, catcher_id, created_at from catchers where tosser_id=?',
      tosserId,
      function(error, results) {
        if (error) {
          return cb(error);
        }
        if (results.length <= 0) {
          return cb(null, { noResults: true });
        }
        return cb(null, results);
      });
}

function fetchCatch(connection, tosserId, catcherId, cb) {
  connection.query(
      'select id, tosser_id, catcher_id, created_at from catchers where tosser_id=? and catcher_id=? limit 1',
      [tosserId, catcherId],
      function(error, results) {
        if (error) {
          return cb(error);
        }
        if (results.length <= 0) {
          return cb(null, { notAuthorized: true });
        }
        return cb(null, results[0]);
      });
}

module.exports = {
  insertCatcher         : insertCatcher,
  fetchCatchersByTosser : fetchCatchersByTosser,
  fetchCatch            : fetchCatch
};
