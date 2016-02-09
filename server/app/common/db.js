var db     = require('mysql'),
    config = require('toss/common/config');

function getConnection() {
  var connection = db.createConnection({
    host     : config.db.host,
    user     : config.db.user,
    password : config.db.password,
    database : config.db.schema
  });
  // Set the sql_mode to traditional, cause that's how I roll.  Also, that is
  // how my production server is set up, and it would be nice to run the same in
  // all places.
  connection.query('SET SESSION sql_mode=\'traditional\'');
  return connection;
}

function closeConnection(connection, cb) {
  connection.end(function(error) {
    if (error) { throw error; }
    if (cb) { cb(); }
  });
}

module.exports = {
  getConnection    : getConnection,
  closeConnection  : closeConnection
};
