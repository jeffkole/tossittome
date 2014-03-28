var db     = require('mysql'),
    crypto = require('crypto'),
    base64 = require('js-base64').Base64;

var config;

var getConnection = function() {
  var connection = db.createConnection({
    host     : config.db.host,
    user     : config.db.user,
    password : config.db.password,
    database : config.db.schema
  });
  connection.connect();
  return connection;
};

var fetchUserByToken = function(connection, token, onSuccess, onFailure) {
  connection.query(
    'select id, email, token, created_at from users where token=? limit 1',
    token,
    function(error, results) {
      if (error) { throw error; }
      if (results.length > 0) {
        var user = results[0];
        onSuccess(user);
      }
      else {
        onFailure();
      }
    });
};

exports.addPage = function(token, url, title) {
  var _onSuccessFn;
  var _run = function() {
    var connection = getConnection();
    fetchUserByToken(connection, token, function(user) {
      connection.query(
        'insert into pages (user_id, url, title) values (?, ?, ?)',
        [user.id, url, title],
        function(error, results) {
          if (error) { throw error; }
          console.log('Added page [%s] for token [%s] (row %d)', url, token, results.insertId);
          _onSuccessFn();
          connection.end();
        });
    }, function() {
      connection.end();
    });
  };

  return {
    onSuccess: function(onSuccessFn) {
      _onSuccessFn = onSuccessFn;
      return this;
    },
    run: function() {
      _run();
    }
  };
};

exports.nextPage = function(token) {
  var _onSuccessFn,
      _onNoPageFn;
  var _run = function() {
    var connection = getConnection();
    fetchUserByToken(connection, token, function(user) {
      connection.beginTransaction(function(error) {
        if (error) { throw error; }

        connection.query(
          'select id, url, title from pages where user_id=? and served_at is null order by created_at limit 1 for update',
          user.id,
          function(error, results) {
            if (error) {
              connection.rollback(function() { throw error; });
            }

            if (results.length > 0) {
              var record = results[0];
              console.log('Next record for token [%s] is [%j]', token, record);
              _onSuccessFn(record);

              connection.query(
                'update pages set served_at=now() where id=?',
                record.id,
                function(error, results) {
                  if (error) {
                    connection.rollback(function() { throw error; });
                  }
                  console.log('Recorded serving for row %d', record.id);
                  connection.commit(function(error) {
                    if (error) {
                      connection.rollback(function() { throw error; });
                    }
                    connection.end();
                  });
                });
            }
            else {
              _onNoPageFn();
            }
          });
      });
    }, function() {
      connection.end()
    });
  };

  return {
    onSuccess: function(onSuccessFn) {
      _onSuccessFn = onSuccessFn;
      return this;
    },
    onNoPage: function(onNoPageFn) {
      _onNoPageFn = onNoPageFn;
      return this;
    },
    run: function() {
      _run();
    }
  };
};

exports.addUser = function(email, password) {
  var _onSuccessFn;
  var _run = function() {
    var rawToken = crypto.randomBytes(8).toString() + ':' + email;
    var token = base64.encodeURI(crypto.createHash('sha1').update(rawToken).digest('binary'));
    var connection = getConnection();
    connection.query(
      'insert into users (email, password, token) values (?, ?, ?)',
      [email, password, token],
      function(error, results) {
        if (error) { throw error; }
        console.log('Added user [%s] as row %d', email, results.insertId);
        _onSuccessFn({
          id       : results.insertId,
          email    : email,
          password : password,
          token    : token
        });
        connection.end();
      });
  };

  return {
    onSuccess: function(onSuccessFn) {
      _onSuccessFn = onSuccessFn;
      return this;
    },
    run: function() {
      _run();
    }
  };
};

exports.fetchUserByEmail = function(email) {
  var _onSuccessFn;
  var _onFailureFn;
  var _run = function() {
    var connection = getConnection();
    connection.query(
        'select id, email, password, token, created_at from users where email=? limit 1',
        email,
        function(error, results) {
          if (error) { throw error; }
          if (results.length > 0) {
            var user = results[0];
            console.log('Found user: %j', user);
            _onSuccessFn(user);
          }
          else {
            console.log('No user found for email %s', email);
            _onFailureFn();
          }
          connection.end();
        });
  };

  return {
    onSuccess: function(onSuccessFn) {
      _onSuccessFn = onSuccessFn;
      return this;
    },
    onFailure: function(onFailureFn) {
      _onFailureFn = onFailureFn;
      return this;
    },
    run: function() {
      _run();
    }
  };
};

exports.setConfig = function(_config) {
  config = _config;
};
