var should     = require('should'),
    db         = require('toss/common/db'),
    catcherDao = require('toss/catcher/dao'),
    util       = require('test/util');

describe('CatcherDAO', function() {
  before(util.deleteCatchers);
  after(util.deleteCatchers);

  var tosserId   = 1;
  var catcherId1 = 2;
  var catcherId2 = 3;

  describe('#insertCatcher', function() {
    it('should add a catcher record', function(done) {
      var connection = db.getConnection();
      catcherDao.insertCatcher(connection, tosserId, catcherId1, function(error, catcher) {
        util.handle(error);
        catcher.should.have.property('id');
        catcher.id.should.be.a.Number;
        db.closeConnection(connection, done);
      });
    });
    it('should not add a duplicate catcher record', function(done) {
      var connection = db.getConnection();
      catcherDao.insertCatcher(connection, tosserId, catcherId1, function(error, catcher1) {
        util.handle(error);
        catcherDao.insertCatcher(connection, tosserId, catcherId1, function(error, catcher2) {
          util.handle(error);
          catcher2.should.have.property('duplicateCatcher');
          db.closeConnection(connection, done);
        });
      });
    });
  });

  describe('#fetchCatchersByTosser', function() {
    before(function(done) {
      var connection = db.getConnection();
      catcherDao.insertCatcher(connection, tosserId, catcherId1, function(error, catcher1) {
        util.handle(error);
        catcherDao.insertCatcher(connection, tosserId, catcherId2, function(error, catcher2) {
          util.handle(error);
          db.closeConnection(connection, done);
        });
      });
    });

    it('should fetch catchers for the tosser', function(done) {
      var connection = db.getConnection();
      catcherDao.fetchCatchersByTosser(connection, tosserId, function(error, catchers) {
        util.handle(error);
        catchers.should.be.an.Array;
        catchers.length.should.eql(2);
        catchers[0].should.have.property('catcher_id', catcherId1);
        catchers[1].should.have.property('catcher_id', catcherId2);
        db.closeConnection(connection, done);
      });
    });
    it('should return noResults when none are found', function(done) {
      var connection = db.getConnection();
      catcherDao.fetchCatchersByTosser(connection, catcherId1, function(error, catchers) {
        util.handle(error);
        catchers.should.have.property('noResults', true);
        db.closeConnection(connection, done);
      });
    });
  });
});
