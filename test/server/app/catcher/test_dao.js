var should     = require('should'),
    db         = require('toss/common/db'),
    catcherDao = require('toss/catcher/dao'),
    util       = require('test/util');

describe('CatcherDAO', function() {
  before(util.deleteCatchers);
  before(util.deleteCatcherRequests);
  afterEach(util.deleteCatchers);
  afterEach(util.deleteCatcherRequests);

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

  describe('#insertCatcherRequest', function() {
    it('should add a catcher request record', function(done) {
      var token = 'ABCDEFG';
      var catcherEmail = 'foo@bar.com';
      var connection = db.getConnection();
      catcherDao.insertCatcherRequest(connection, token, tosserId, catcherEmail, function(error, request) {
        util.handle(error);
        request.should.have.property('id');
        // TODO: actually check the record was written to the db and has the
        // expected status
        db.closeConnection(connection, done);
      });
    });
  });

  describe('#fetchCatcherRequestByToken', function() {
    var token = 'ABCDEFG';
    var catcherEmail = 'foo@bar.com';
    beforeEach(function(done) {
      var connection = db.getConnection();
      catcherDao.insertCatcherRequest(connection, token, tosserId, catcherEmail, function(error, request) {
        util.handle(error);
        db.closeConnection(connection, done);
      });
    });

    it('should return noResults when none are found', function(done) {
      var connection = db.getConnection();
      catcherDao.fetchCatcherRequestByToken(connection, 'NON_EXISTENT_TOKEN', function(error, request) {
        util.handle(error);
        request.should.have.property('noResults', true);
        db.closeConnection(connection, done);
      });
    });
    it('should fetch catcher requests when some exist', function(done) {
      var connection = db.getConnection();
      catcherDao.fetchCatcherRequestByToken(connection, token, function(error, request) {
        util.handle(error);
        request.should.have.property('id');
        request.should.have.property('token', token);
        request.should.have.property('requesting_user_id', tosserId);
        request.should.have.property('catcher_email', catcherEmail);
        request.should.have.property('created_at');
        request.should.have.property('status', 'open');
        request.should.have.property('updated_at');
        db.closeConnection(connection, done);
      });
    });
  });

  describe('#fetchCatcherRequestsByRequestingUser', function() {
    var token = 'ABCDEFG';
    var catcherEmail = 'foo@bar.com';
    beforeEach(function(done) {
      var connection = db.getConnection();
      catcherDao.insertCatcherRequest(connection, token, tosserId, catcherEmail, function(error, request) {
        util.handle(error);
        db.closeConnection(connection, done);
      });
    });

    it('should return noResults when none are found', function(done) {
      var connection = db.getConnection();
      catcherDao.fetchCatcherRequestsByRequestingUser(connection, 10001, function(error, request) {
        util.handle(error);
        request.should.have.property('noResults', true);
        db.closeConnection(connection, done);
      });
    });
    it('should fetch catcher requests when some exist', function(done) {
      var connection = db.getConnection();
      catcherDao.fetchCatcherRequestsByRequestingUser(connection, tosserId, function(error, requests) {
        util.handle(error);
        requests.should.be.an.Array;
        requests.length.should.eql(1);
        requests[0].should.have.property('id');
        requests[0].should.have.property('token', token);
        requests[0].should.have.property('requesting_user_id', tosserId);
        requests[0].should.have.property('catcher_email', catcherEmail);
        requests[0].should.have.property('created_at');
        requests[0].should.have.property('status', 'open');
        requests[0].should.have.property('updated_at');
        db.closeConnection(connection, done);
      });
    });
  });

  describe('#updateCatcherRequest', function() {
    it('should set accepted to true when accepted');
    it('should set accepted to false when denied');
  });
});
