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

function deleteCatcherRequests(done) {
  var connection = db.getConnection();
  connection.query('delete from catcher_requests', function(error) {
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

function resetAutoIncrement(table, /* tables,... */ cb) {
  var tables = [table];
  if (arguments.length > 2) {
    tables = Array.prototype.slice.call(arguments, 0, -1);
    cb = arguments[arguments.length - 1];
  }
  var count = 0;
  tables.forEach(function(table) {
    var connection = db.getConnection();
    connection.query('alter table ' + table + ' auto_increment=1', function(error) {
      if (error) { throw error; }
      db.closeConnection(connection, function() {
        count++;
        if (count === tables.length) {
          cb();
        }
      });
    });
  });
}

module.exports = {
  pass                  : pass,
  fail                  : fail,
  handle                : handle,
  deleteCatchers        : deleteCatchers,
  deleteCatcherRequests : deleteCatcherRequests,
  deleteUsers           : deleteUsers,
  deletePages           : deletePages,
  resetAutoIncrement    : resetAutoIncrement
};
