var db     = require('mysql'),
    config = require('toss/common/config');

function getConnection() {
  var connection = db.createConnection({
    host     : config.db.host,
    user     : config.db.user,
    password : config.db.password,
    database : config.db.schema
  });
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
