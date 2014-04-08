var should  = require('should'),
    db      = require('toss/common/db'),
    userDao = require('toss/user/dao'),
    util    = require('test/util');

describe('UserDAO', function() {
  before(util.deleteUsers);
  after(util.deleteUsers);

  var testUser1 = {
    email    : 'foo@bar.com',
    password : 'password',
    token    : 'AAAA'
  };
  var testUser2 = {
    email    : 'bar@foo.com',
    password : 'wordpass',
    token    : 'ZZZZ'
  };
  var testUser3 = {
    email    : 'bar@baz.com',
    password : 'wordpass',
    token    : 'GGGG'
  };

  describe('#insertUser()', function() {
    it('should add a user with a unique email', function(done) {
      var connection = db.getConnection();
      userDao.insertUser(connection, testUser1.email, testUser1.password, testUser1.token, function(error, user) {
        util.handle(error);
        user.should.have.property('id');
        user.id.should.be.a.Number;
        user.should.have.property('email', testUser1.email);
        user.should.have.property('password', testUser1.password);
        user.should.have.property('token', testUser1.token);
        db.closeConnection(connection, done);
      });
    });
    it('should not add a user with a duplicate email', function(done) {
      var connection = db.getConnection();
      userDao.insertUser(connection, testUser1.email, testUser1.password, testUser1.token + 'MOREAAAAs', function(error, user) {
        util.handle(error);
        user.should.have.property('duplicateEmail');
        db.closeConnection(connection, done);
      });
    });
  });

  describe('#fetchUserByToken()', function() {
    before(function(done) {
      var connection = db.getConnection();
      userDao.insertUser(connection, testUser2.email, testUser2.password, testUser2.token, function(error, user) {
        util.handle(error);
        if (user.duplicateEmail) {
          util.fail();
        }
        db.closeConnection(connection, done);
      });
    });

    it('should find a user with the right token', function(done) {
      var connection = db.getConnection();
      userDao.fetchUserByToken(connection, testUser2.token, function(error, user) {
        util.handle(error);
        user.should.have.property('id');
        user.id.should.be.a.Number;
        user.should.have.property('email', testUser2.email);
        user.should.have.property('password', testUser2.password);
        user.should.have.property('token', testUser2.token);
        db.closeConnection(connection, done);
      });
    });
    it('should return a noResults message', function(done) {
      var connection = db.getConnection();
      userDao.fetchUserByToken(connection, testUser2.token + 'MOREZZZZs', function(error, user) {
        util.handle(error);
        user.should.have.property('noResults');
        user.noResults.should.be.true;
        db.closeConnection(connection, done);
      });
    });
  });

  describe('#fetchUserByEmail()', function() {
    before(function(done) {
      var connection = db.getConnection();
      userDao.insertUser(connection, testUser3.email, testUser3.password, testUser3.token, function(error, user) {
        util.handle(error);
        if (user.duplicateEmail) {
          util.fail();
        }
        db.closeConnection(connection, done);
      });
    });

    it('should find a user with the right email', function(done) {
      var connection = db.getConnection();
      userDao.fetchUserByEmail(connection, testUser3.email, function(error, user) {
        util.handle(error);
        user.should.have.property('id');
        user.id.should.be.a.Number;
        user.should.have.property('email', testUser3.email);
        user.should.have.property('password', testUser3.password);
        user.should.have.property('token', testUser3.token);
        db.closeConnection(connection, done);
      });
    });
    it('should return a noResults message', function(done) {
      var connection = db.getConnection();
      userDao.fetchUserByEmail(connection, testUser3.email + 'MOREZZZZs', function(error, user) {
        util.handle(error);
        user.should.have.property('noResults');
        user.noResults.should.be.true;
        db.closeConnection(connection, done);
      });
    });
  });
});
