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
      pageDao.insertPage(connection, 1, 2, 'http://tossitto.me', 'Tossing Left and Right', function(error, page) {
        util.handle(error);
        page.should.have.property('id');
        page.id.should.be.a.Number;
        db.closeConnection(connection, done);
      });
    });

    it('should insert a page with a really long title', function(done) {
      var connection = db.getConnection();
      // The title from the page that first broke me:
      // https://www.reddit.com/r/IAmA/comments/40cmzb/i_am_90_years_old_an_officer_during_wwii_a/
      var title = 'I Am 90 Years Old - An officer during WWII, a retired educator, and more engaged with society today than I\'ve ever been before. AMA! : IAmA';
      var tosserId = 1;
      var catcherId = 4;
      pageDao.insertPage(connection, tosserId, catcherId,
        'http://tossitto.me', title,
        function (error, page) {
          util.handle(error);
          page.should.have.property('id');
          page.id.should.be.a.Number;
          var start = 1;
          var limit = 1;
          pageDao.fetchTossHistory(connection, tosserId, start, limit,
            function (error, pages) {
              util.handle(error);
              pages.length.should.equal(1);
              pages[0].id.should.equal(page.id);
              pages[0].title.should.equal(title.substring(0, 128));
              db.closeConnection(connection, done);
            }
          );
        }
      );
    });
  });

  describe('#fetchNextPages', function() {
    it('should return noResults when there are no pages', function(done) {
      var connection = db.getConnection();
      pageDao.fetchNextPages(connection, 3, function(error, pages) {
        util.handle(error);
        pages.should.have.property('noResults');
        db.closeConnection(connection, done);
      });
    });
    it('should return multiple results and mark them as served', function(done) {
      var connection = db.getConnection();
      pageDao.insertPage(connection, 1, 2, 'http://tossitto.us', 'Tossing Across the States', function(error, page) {
        util.handle(error);
        pageDao.fetchNextPages(connection, 2, function(error, pages) {
          util.handle(error);
          pages.should.be.an.Array;
          pages.length.should.equal(2);
          pages[0].url.should.equal('http://tossitto.me');
          pages[1].url.should.equal('http://tossitto.us');
          pages[0].should.have.property('tosser_id', 1);
          pages[1].should.have.property('tosser_id', 1);
          db.closeConnection(connection, done);
        });
      });
    });
  });
});
