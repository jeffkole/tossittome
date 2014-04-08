var should  = require('should'),
    db      = require('toss/common/db'),
    pageDao = require('toss/page/dao'),
    util    = require('test/util');

describe('PageDAO', function() {
  before(util.deletePages);
  after(util.deletePages);

  describe('#insertPage()', function() {
    it('should insert a new page', function(done) {
      var connection = db.getConnection();
      pageDao.insertPage(connection, 1, 'http://tossitto.me', 'Tossing Left and Right', function(error, page) {
        util.handle(error);
        page.should.have.property('id');
        page.id.should.be.a.Number;
        db.closeConnection(connection, done);
      });
    });
  });

  describe('#fetchNextPages', function() {
    it('should return noResults when there are no pages', function(done) {
      var connection = db.getConnection();
      pageDao.fetchNextPages(connection, 2, function(error, pages) {
        util.handle(error);
        pages.should.have.property('noResults');
        db.closeConnection(connection, done);
      });
    });
    it('should return multiple results and mark them as served', function(done) {
      var connection = db.getConnection();
      pageDao.insertPage(connection, 1, 'http://tossitto.us', 'Tossing Across the States', function(error, page) {
        util.handle(error);
        pageDao.fetchNextPages(connection, 1, function(error, pages) {
          util.handle(error);
          pages.should.be.an.Array;
          pages.length.should.equal(2);
          pages[0].url.should.equal('http://tossitto.me');
          pages[1].url.should.equal('http://tossitto.us');
          db.closeConnection(connection, done);
        });
      });
    });
  });
});
