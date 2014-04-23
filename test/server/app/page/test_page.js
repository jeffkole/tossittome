var should  = require('should'),
    db      = require('toss/common/db'),
    page    = require('toss/page/page'),
    userDao = require('toss/user/dao'),
    util    = require('test/util');

describe('Page', function() {
  before(util.deleteUsers);
  before(util.deletePages);
  after(util.deleteUsers);
  afterEach(util.deletePages);

  var testTosser = {
    email    : 'foo@bar.com',
    password : 'password',
    token    : 'AAAA'
  };
  var testCatcher = {
    email    : 'bar@baz.com',
    password : 'password',
    token    : 'BBBB'
  };

  before(function(done) {
    var connection = db.getConnection();
    userDao.insertUser(connection, testTosser.email, testTosser.password, testTosser.token, function(error, tosser) {
      util.handle(error);
      if (tosser.duplicateEmail) {
        util.fail();
      }
      userDao.insertUser(connection, testCatcher.email, testCatcher.password, testCatcher.token, function(error, catcher) {
        util.handle(error);
        if (catcher.duplicateEmail) {
          util.fail();
        }
        db.closeConnection(connection, done);
      });
    });
  });

  describe('#addPage()', function() {
    it('should insert a new page for valid toss and catch users', function(done) {
      var connection = db.getConnection();
      page.addPage(connection,
                   testTosser.token,
                   testCatcher.token,
                   'http://tossitto.me',
                   'Tossing Back and Forth', function(error, page) {
        util.handle(error);
        page.should.have.property('id');
        page.id.should.be.a.Number;
        // TODO: actually check the existence of the page and toss records
        db.closeConnection(connection, done);
      });
    });
    it('should return noResults when the tosser does not exist', function(done) {
      var connection = db.getConnection();
      page.addPage(connection,
                   'NON-EXISTENT-TOKEN',
                   testCatcher.token,
                   'http://tossitto.me',
                   'Tossing Back and Forth', function(error, page) {
        util.handle(error);
        page.should.have.property('noResults');
        db.closeConnection(connection, done);
      });
    });
    it('should return noResults when the catcher does not exist', function(done) {
      var connection = db.getConnection();
      page.addPage(connection,
                   testTosser.token,
                   'NON-EXISTENT-TOKEN',
                   'http://tossitto.me',
                   'Tossing Back and Forth', function(error, page) {
        util.handle(error);
        page.should.have.property('noResults');
        db.closeConnection(connection, done);
      });
    });
  });

  describe('#getNextPages()', function() {
    before(function(done) {
      var connection = db.getConnection();
      page.addPage(connection,
                   testTosser.token,
                   testCatcher.token,
                   'http://tossitto.me',
                   'Tossing Back and Forth', function(error, p) {
        util.handle(error);
        page.addPage(connection,
                     testTosser.token,
                     testCatcher.token,
                     'http://tossitto.us',
                     'Tossing Here and There', function(error, p) {
          util.handle(error);
          db.closeConnection(connection, done);
        });
      });
    });

    it('should fetch multiple pages for a valid user', function(done) {
      var connection = db.getConnection();
      page.getNextPages(connection, testCatcher.token, function(error, pages) {
        util.handle(error);
        pages.should.be.an.Array;
        pages.length.should.equal(2);
        pages[0].should.have.property('title', 'Tossing Back and Forth');
        pages[0].should.have.property('tosser');
        pages[0].tosser.should.have.property('id');
        pages[0].tosser.should.have.property('email');
        db.closeConnection(connection, done);
      });
    });
    it('should return noResults when the user does not exist', function(done) {
      var connection = db.getConnection();
      page.getNextPages(connection, 'ZZZZ', function(error, page) {
        util.handle(error);
        page.should.have.property('noResults');
        db.closeConnection(connection, done);
      });
    });
  });
});
