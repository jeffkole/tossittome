var db     = require('mysql'),
    crypto = require('crypto'),
    base64 = require('js-base64').Base64;

var db_host   = 'localhost',
    db_user   = 'tossa',
    db_pass   = 'password',
    db_schema = 'tossa';

var getConnection = function() {
  var connection = db.createConnection({
    host     : db_host,
    user     : db_user,
    password : db_pass,
    database : db_schema
  });
  connection.connect();
  return connection;
};

var getUserId = function(connection, token, onSuccess, onFailure) {
  connection.query(
    'select id from users where token=? limit 1',
    token,
    function(error, results) {
      if (error) { throw error; }
      if (results.length > 0) {
        var record = results[0];
        onSuccess(record.id);
      }
      else {
        onFailure();
      }
    });
};

exports.addSite = function(token, site) {
  var _onSuccessFn;
  var _run = function() {
    var connection = getConnection();
    getUserId(connection, token, function(id) {
      connection.query(
        'insert into sites (user_id, site) values (?, ?)',
        [id, site],
        function(error, results) {
          if (error) { throw error; }
          console.log('Added site [%s] for token [%s] (row %d)', site, token, results.insertId);
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

exports.nextSite = function(token) {
  var _onSuccessFn,
      _onNoSiteFn;
  var _run = function() {
    var connection = getConnection();
    getUserId(connection, token, function(id) {
      connection.beginTransaction(function(error) {
        if (error) { throw error; }

        connection.query(
          'select id, site from sites where user_id=? and served_at is null order by created_at limit 1 for update',
          id,
          function(error, results) {
            if (error) {
              connection.rollback(function() { throw error; });
            }

            if (results.length > 0) {
              var record = results[0];
              console.log('Next record for token [%s] is [%j]', token, record);
              _onSuccessFn(record);

              connection.query(
                'update sites set served_at=now() where id=?',
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
              _onNoSiteFn();
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
    onNoSite: function(onNoSiteFn) {
      _onNoSiteFn = onNoSiteFn;
      return this;
    },
    run: function() {
      _run();
    }
  };
};

exports.addUser = function(email) {
  var _onSuccessFn;
  var _run = function() {
    var rawToken = crypto.randomBytes(8).toString() + ':' + email;
    var token = base64.encodeURI(crypto.createHash('sha1').update(rawToken).digest('binary'));
    var connection = getConnection();
    connection.query(
      'insert into users (email, token) values (?, ?)',
      [email, token],
      function(error, results) {
        if (error) { throw error; }
        console.log('Added user [%s] as row %d', email, results.insertId);
        _onSuccessFn();
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
