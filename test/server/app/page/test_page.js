var should  = require('should'),
    db      = require('toss/common/db'),
    page    = require('toss/page/page'),
    userDao = require('toss/user/dao'),
    util    = require('test/util');

describe('Page', function() {
  before(util.deleteUsers);
  before(util.deletePages);
  after(util.deleteUsers);
  after(util.deletePages);

  var testUser = {
    email    : 'foo@bar.com',
    password : 'password',
    token    : 'AAAA'
  };

  before(function(done) {
    var connection = db.getConnection();
    userDao.insertUser(connection, testUser.email, testUser.password, testUser.token, function(error, user) {
      util.handle(error);
      if (user.noResults) {
        util.fail();
      }
      db.closeConnection(connection, done);
    });
  });

  describe('#addPage()', function() {
    it('should insert a new page for a valid user', function(done) {
      var connection = db.getConnection();
      page.addPage(connection, testUser.token, 'http://tossitto.me', 'Tossing Back and Forth', function(error, page) {
        util.handle(error);
        page.should.have.property('id');
        page.id.should.be.a.Number;
        db.closeConnection(connection, done);
      });
    });
    it('should return noResults when the user does not exist', function(done) {
      var connection = db.getConnection();
      page.addPage(connection, 'BBBB', 'http://tossitto.me', 'Tossing Back and Forth', function(error, page) {
        util.handle(error);
        page.should.have.property('noResults');
        db.closeConnection(connection, done);
      });
    });
  });

  describe('#getNextPages()', function() {
    it('should fetch multiple pages for a valid user', function(done) {
      var connection = db.getConnection();
      page.getNextPages(connection, testUser.token, function(error, pages) {
        util.handle(error);
        pages.should.be.an.Array;
        pages.length.should.equal(1);
        pages[0].title.should.equal('Tossing Back and Forth');
        db.closeConnection(connection, done);
      });
    });
    it('should return noResults when the user does not exist', function(done) {
      var connection = db.getConnection();
      page.getNextPages(connection, 'BBBB', function(error, page) {
        util.handle(error);
        page.should.have.property('noResults');
        db.closeConnection(connection, done);
      });
    });
  });
});
