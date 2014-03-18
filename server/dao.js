var db = require('mysql');

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

exports.addSite = function(user, site) {
  var _onSuccessFn;
  var _run = function() {
    var connection = getConnection();
    connection.query(
        'insert into sites (user, site) values (?, ?)',
        [user, site],
        function(error, results) {
          if (error) { throw error; }
          console.log('Added site [%s] for user [%s] (row %d)', site, user, results.insertId);
          _onSuccessFn();
        });
    connection.end();
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

exports.nextSite = function(user) {
  var _onSuccessFn,
      _onNoSiteFn;
  var _run = function() {
    var connection = getConnection();
    connection.beginTransaction(function(error) {
      if (error) { throw error; }

      connection.query(
        'select id, site from sites where user=? and served_at is null order by created_at limit 1 for update',
        user,
        function(error, results) {
          if (error) {
            connection.rollback(function() { throw error; });
          }

          if (results.length > 0) {
            var record = results[0];
            console.log('Next record for user [%s] is [%s]', user, JSON.stringify(record));
            _onSuccessFn(record);

            connection.query(
              'update sites set served_at=now() where id=?',
              record.id,
              function(error, results) {
                if (error) {
                  connection.rollback(function() { throw error; });
                }
                console.log('Recorded serving for row %d', record.id);
              });
          }
          else {
            _onNoSiteFn();
          }

          connection.commit(function(error) {
            if (error) {
              connection.rollback(function() { throw error; });
            }
          });

          connection.end();
        });
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
