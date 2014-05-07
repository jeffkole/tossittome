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

function insertCatcherRequest(connection, token, requestingUserId, catcherEmail, cb) {
  connection.query(
      'insert into catcher_requests (token, requesting_user_id, catcher_email) values (?, ?, ?)',
      [token, requestingUserId, catcherEmail],
      function(error, results) {
        if (error) {
          return cb(error);
        }
        if (results.affectedRows === 0) {
          return cb(new Error('No rows changed'));
        }
        return cb(null, { id: results.insertId });
      });
}

function fetchCatcherRequestByToken(connection, token, cb) {
  connection.query(
      'select id, token, requesting_user_id, catcher_email, created_at, status, updated_at ' +
      'from catcher_requests where token=? limit 1',
      token,
      function(error, results) {
        if (error) {
          return cb(error);
        }
        if (results.length <= 0) {
          return cb(null, { noResults: true });
        }
        return cb(null, results[0]);
      });
}

function fetchCatcherRequestsByRequestingUser(connection, requestingUserId, cb) {
  connection.query(
      'select id, token, requesting_user_id, catcher_email, created_at, status, updated_at ' +
      'from catcher_requests where requesting_user_id=? ' +
      'order by created_at desc',
      requestingUserId,
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

function updateCatcherRequest(connection, requestId, state, cb) {
  if (state !== 'accepted' &&
      state !== 'rejected' &&
      state !== 'ignored') {
    return cb(new Error('Unknown state: ' + state));
  }

  connection.query(
      'update catcher_requests set status=?, updated_at=now() where id=?',
      [state, requestId],
      function(error, results) {
        if (error) {
          return cb(error);
        }
        if (results.affectedRows === 0) {
          return cb(new Error('No rows changed'));
        }
        return cb(null, { id: requestId });
      });
}

module.exports = {
  insertCatcher                        : insertCatcher,
  fetchCatchersByTosser                : fetchCatchersByTosser,
  fetchCatch                           : fetchCatch,
  insertCatcherRequest                 : insertCatcherRequest,
  fetchCatcherRequestByToken           : fetchCatcherRequestByToken,
  fetchCatcherRequestsByRequestingUser : fetchCatcherRequestsByRequestingUser,
  updateCatcherRequest                 : updateCatcherRequest
};
