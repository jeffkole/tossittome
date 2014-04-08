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
  fetchUserByToken : fetchUserByToken,
  fetchUserByEmail : fetchUserByEmail
};
