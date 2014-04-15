var log = require('toss/common/log');

function insertUser(connection, email, password, token, cb) {
  connection.query(
      'insert into users (email, password, token) ' +
      'select ?, ?, ? from dual where not exists (select 1 from users where email=?)',
      [email, password, token, email],
      function(error, results) {
        if (error) {
          return cb(error);
        }
        if (results.affectedRows === 0) {
          return cb(null, { duplicateEmail: true });
        }
        log.info('Added user [%s] as row %d', email, results.insertId);
        return cb(null, {
          id       : results.insertId,
          email    : email,
          password : password,
          token    : token
        });
      });
}

function fetchUserById(connection, id, /* ids,... */ cb) {
  // Allow id to be an array or a vararg
  var ids = (id instanceof Array ? id : [id]);
  var qqs = '?';
  // Allow for multiple IDs to be specified as arguments, and find all of the
  // users with those IDs.
  if (arguments.length > 3) {
    // add all extra IDs from the argument list to the ids array
    ids = ids.concat(Array.prototype.slice.call(arguments, 2, -1));
    // Reassign cb to be the final argument
    cb = arguments[arguments.length - 1];
  }
  for (var i = 1; i < ids.length; i++) {
    qqs += ',?';
  }
  connection.query(
      'select id, email, password, token, created_at from users where id in (' + qqs + ')',
      ids,
      function(error, results) {
        if (error) {
          return cb(error);
        }
        if (results.length <= 0) {
          return cb(null, { noResults: true });
        }
        // If more than 1 user was requested, return them all
        if (ids.length > 1) {
          return cb(null, results);
        }
        // Otherwise, just return the first result
        return cb(null, results[0]);
      });
}

function fetchUserByToken(connection, token, cb) {
  connection.query(
      'select id, email, password, token, created_at from users where token=? limit 1',
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

function fetchUserByEmail(connection, email, cb) {
  connection.query(
      'select id, email, password, token, created_at from users where email=? limit 1',
      email,
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

module.exports = {
  insertUser       : insertUser,
  fetchUserById    : fetchUserById,
  fetchUserByToken : fetchUserByToken,
  fetchUserByEmail : fetchUserByEmail
};
