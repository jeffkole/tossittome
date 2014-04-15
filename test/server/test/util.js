var should = require('should'),
    db     = require('toss/common/db');

function pass() {
  return true.should.be.true;
}

function fail(message) {
  throw new Error(message);
}

function handle(error) {
  if (error) {
    throw error;
  }
}

function deleteCatchers(done) {
  var connection = db.getConnection();
  connection.query('delete from catchers', function(error) {
    if (error) { throw error; }
    db.closeConnection(connection, done);
  });
}

function deleteUsers(done) {
  var connection = db.getConnection();
  connection.query('delete from users', function(error) {
    if (error) { throw error; }
    db.closeConnection(connection, done);
  });
}

function deletePages(done) {
  var connection = db.getConnection();
  connection.query('delete from pages', function(error) {
    if (error) { throw error; }
    db.closeConnection(connection, done);
  });
}

module.exports = {
  pass            : pass,
  fail            : fail,
  handle          : handle,
  deleteCatchers  : deleteCatchers,
  deleteUsers     : deleteUsers,
  deletePages     : deletePages
};
