var should   = require('should'),
    db       = require('toss/common/db'),
    register = require('toss/user/register'),
    util     = require('test/util');

describe('Register', function() {
  describe('#addUser()', function() {
    before(util.deleteUsers);
    after(util.deleteUsers);

    var testUser = {
      email    : 'foo@bar.com',
      password : 'password',
      token    : 'AAAA'
    };

    it('should call cb with a user object when successful', function(done) {
      var connection = db.getConnection();
      register.addUser(connection, testUser.email, testUser.password, function(error, user) {
        (error === null).should.be.true;
        user.should.have.property('id');
        user.id.should.be.a.Number;
        user.should.have.property('email', testUser.email);
        user.should.have.property('password');
        user.password.should.be.a.String;
        user.password.should.not.equal(testUser.password);
        user.should.have.property('token');
        user.token.should.be.a.String;
        user.token.should.not.equal(testUser.token);
        db.closeConnection(connection, done);
      });
    });
    it('should call cb with an error object when a duplicate email address is used', function(done) {
      var connection = db.getConnection();
      register.addUser(connection, testUser.email, testUser.password, function(error, user) {
        (error === null).should.be.true;
        user.should.have.property('duplicateEmail', true);
        db.closeConnection(connection, done);
      });
    });
  });
});
