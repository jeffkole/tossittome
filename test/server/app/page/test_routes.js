var http   = require('node-mocks-http'),
    rewire = require('rewire'),
    should = require('should'),
    sinon  = require('sinon'),
    util   = require('test/util');

var routes = rewire('toss/page/routes');

// Adds in functions that are missing from mockRequest
var completeRequest = function(request) {
  request.get = function(header) {
    return '';
  };
  return request;
};

describe('PageRoutes', function() {
  describe('GET /toss', function() {
    var initiateToss = routes.__get__('initiateToss');
    var token = 'AAAA';
    var createGoodRequest = function() {
      return completeRequest(http.createRequest({
        cookies: { token: token }
      }));
    };

    beforeEach(function() {
      var dbMock = {
        getConnection: sinon.stub(),
        closeConnection: sinon.stub()
      };
      var catcherMock = {
        getCatchers: sinon.stub().callsArg(2)
      };
      routes.__set__('db', dbMock);
      routes.__set__('catcher', catcherMock);
    });

    afterEach(function() {
      var dbMock = routes.__get__('db');
      if (dbMock.getConnection.called === undefined) {
        util.fail('getConnection.called is undefined');
      }
      if (dbMock.getConnection.called) {
        dbMock.closeConnection.callCount.should.eql(dbMock.getConnection.callCount);
      }
    });

    it('should render toss_login.js when no token is in the cookie', function() {
      var request = completeRequest(http.createRequest({}));
      var response = http.createResponse();
      initiateToss(request, response);
      response._getRenderView().should.eql('toss_login.js');
    });

    it('should send 500 on connection error', function() {
      var catcherMock = {
        getCatchers: sinon.stub().callsArgWith(2, new Error('Connection error'))
      };
      routes.__set__('catcher', catcherMock);

      var request = createGoodRequest();
      var response = http.createResponse();
      initiateToss(request, response);
      response.statusCode.should.eql(500);
    });

    it('should render toss_login when no tosser is found', function() {
      var catcherMock = {
        getCatchers: sinon.stub().callsArgWith(2, null, { noTosser: true })
      };
      routes.__set__('catcher', catcherMock);

      var request = createGoodRequest();
      var response = http.createResponse();
      initiateToss(request, response);
      response._getRenderView().should.eql('toss_login.js');
    });

    it('should render catch_selection on success', function() {
      var catchers = [
        { id: 1, email: 'foo@bar.com', token: 'AAAA' },
        { id: 2, email: 'bar@foo.com', token: 'BBBB' }
      ];
      var catcherMock = {
        getCatchers: sinon.stub().callsArgWith(2, null, catchers)
      };
      routes.__set__('catcher', catcherMock);

      var request = createGoodRequest();
      var response = http.createResponse();
      initiateToss(request, response);
      response._getRenderView().should.eql('catcher_selection_response.js');
    });
  });

  describe('POST /toss', function() {
    var completeToss = routes.__get__('completeToss');
    var tosserToken = 'AAAA';
    var catcherToken = 'BBBB';
    var createGoodRequest = function() {
      return completeRequest(http.createRequest({
        cookies: { token: tosserToken },
        body: {
          u: 'http://tossitto.me',
          i: 'TossItToMe',
          c: catcherToken
        }
      }));
    };

    beforeEach(function() {
      var connectionMock = {
        beginTransaction: sinon.stub().callsArg(0),
        commit: sinon.stub().callsArg(0)
      };
      var dbMock = {
        getConnection: sinon.stub().returns(connectionMock),
        closeConnection: sinon.stub()
      };
      var catcherMock = {
        checkCatchAuthorization: sinon.stub().callsArgWith(3, null, [{ id:1 }])
      };
      var pageMock = {
        addPage: sinon.stub().callsArgWith(5, null, { id: 1 })
      };
      routes.__set__('db', dbMock);
      routes.__set__('catcher', catcherMock);
      routes.__set__('page', pageMock);
    });

    afterEach(function() {
      var dbMock = routes.__get__('db');
      if (dbMock.getConnection.called === undefined) {
        util.fail('getConnection.called is undefined');
      }
      if (dbMock.getConnection.called) {
        dbMock.closeConnection.callCount.should.eql(dbMock.getConnection.callCount, 'Close connection');
      }

      var connectionMock = dbMock.getConnection();
      if (connectionMock.beginTransaction.called === undefined) {
        util.fail('beginTransaction.called is undefined');
      }
      if (connectionMock.beginTransaction.called) {
        connectionMock.commit.callCount.should.eql(connectionMock.beginTransaction.callCount, 'commit');
      }
    });

    it('should send 401 when no token is in the cookie', function() {
      var request = completeRequest(http.createRequest({}));
      var response = http.createResponse();
      completeToss(request, response);
      response.statusCode.should.eql(401);
    });

    it('should send a 400 response when the required params are missing', function() {
      var request = completeRequest(http.createRequest({
        cookies: { token: tosserToken }
      }));
      var response = http.createResponse();
      completeToss(request, response);
      response.statusCode.should.eql(400);
    });

    it('should send 500 on connection error', function() {
      routes.__get__('catcher').checkCatchAuthorization = sinon.stub().callsArgWith(3, new Error('Connection error'));

      var request = createGoodRequest();
      var response = http.createResponse();
      completeToss(request, response);
      response.statusCode.should.eql(500);
    });

    it('should send 400 on missing tosser', function() {
      routes.__get__('catcher').checkCatchAuthorization = sinon.stub().callsArgWith(3, null, { noTosser: true });

      var request = createGoodRequest();
      var response = http.createResponse();
      completeToss(request, response);
      response.statusCode.should.eql(400);
    });

    it('should send 400 on missing catcher', function() {
      routes.__get__('catcher').checkCatchAuthorization = sinon.stub().callsArgWith(3, null, { noCatcher: true });

      var request = createGoodRequest();
      var response = http.createResponse();
      completeToss(request, response);
      response.statusCode.should.eql(400);
    });

    it('should send 401 when catcher has not authorized tosser', function() {
      routes.__get__('catcher').checkCatchAuthorization = sinon.stub().callsArgWith(3, null, { notAuthorized: true });

      var request = createGoodRequest();
      var response = http.createResponse();
      completeToss(request, response);
      response.statusCode.should.eql(401);
    });

    it('should send 500 on transaction failure', function() {
      var connectionMock = {
        beginTransaction: sinon.stub().callsArgWith(0, new Error('Transaction failure')),
        commit: sinon.stub().callsArg(0)
      };
      routes.__get__('db').getConnection = sinon.stub().returns(connectionMock);

      var request = createGoodRequest();
      var response = http.createResponse();
      completeToss(request, response);
      response.statusCode.should.eql(500);
      // HACK: Make a call to commit() to satisfy the afterEach check, because
      // we know that commit is not called in this case
      connectionMock.commit(function() {});
    });

    it('should send 500 on connection failure', function() {
      routes.__get__('page').addPage = sinon.stub().callsArgWith(5, new Error('Connection failure'));

      var request = createGoodRequest();
      var response = http.createResponse();
      completeToss(request, response);
      response.statusCode.should.eql(500);
    });

    it('should send 400 when no results', function() {
      routes.__get__('page').addPage = sinon.stub().callsArgWith(5, null, { noResults: true });

      var request = createGoodRequest();
      var response = http.createResponse();
      completeToss(request, response);
      response.statusCode.should.eql(400);
    });

    it('should send 200 on success', function() {
      var request = createGoodRequest();
      var response = http.createResponse();
      completeToss(request, response);
      response.statusCode.should.eql(200);
    });

    it('should throw an error on commit error', function() {
      routes.__get__('db').getConnection = sinon.stub().returns({
        beginTransaction: sinon.stub().callsArg(0),
        commit: sinon.stub().callsArgWith(0, new Error('Commit failure'))
      });
      routes.__get__('db').closeConnection = sinon.stub().callsArg(1);

      var request = createGoodRequest();
      var response = http.createResponse();
      (function() {
        completeToss(request, response);
      }).should.throw('Commit failure');
    });
  });

  describe('GET /catch', function() {
    var getNextPages = routes.__get__('getNextPages');
    var token = 'AAAA';
    var createGoodRequest = function() {
      return http.createRequest({
        cookies: { token: token }
      });
    };

    beforeEach(function() {
      var connectionMock = {
        beginTransaction: sinon.stub().callsArg(0),
        commit: sinon.stub().callsArg(0)
      };
      var dbMock = {
        getConnection: sinon.stub().returns(connectionMock),
        closeConnection: sinon.stub()
      };
      var pageMock = {
        getNextPages: sinon.stub()
      };
      routes.__set__('db', dbMock);
      routes.__set__('page', pageMock);
    });

    afterEach(function() {
      var dbMock = routes.__get__('db');
      if (dbMock.getConnection.called === undefined) {
        util.fail('getConnection.called is undefined');
      }
      if (dbMock.getConnection.called) {
        dbMock.closeConnection.callCount.should.eql(dbMock.getConnection.callCount, 'Close connection');
      }

      var connectionMock = dbMock.getConnection();
      if (connectionMock.beginTransaction.called === undefined) {
        util.fail('beginTransaction.called is undefined');
      }
      if (connectionMock.beginTransaction.called) {
        connectionMock.commit.callCount.should.eql(connectionMock.beginTransaction.callCount, 'commit');
      }
    });

    it('should send a 401 response when no token is in the cookie', function() {
      var request = http.createRequest({});
      var response = http.createResponse();
      getNextPages(request, response);
      response.statusCode.should.eql(401);
      response._getData().should.eql('Not authorized');
    });

    it('should send a 500 response on transaction failure', function() {
      var connectionMock = {
        beginTransaction: sinon.stub().callsArgWith(0, new Error('Transaction failure')),
        commit: sinon.stub().callsArg(0)
      };
      routes.__get__('db').getConnection = sinon.stub().returns(connectionMock);

      var request = createGoodRequest();
      var response = http.createResponse();
      getNextPages(request, response);
      response.statusCode.should.eql(500);
      // HACK: Make a call to commit() to satisfy the afterEach check, because
      // we know that commit is not called in this case
      connectionMock.commit(function() {});
    });

    it('should send a 500 response on connection failure', function() {
      routes.__get__('page').getNextPages = sinon.stub().callsArgWith(2, new Error('Connection failure'));

      var request = createGoodRequest();
      var response = http.createResponse();
      getNextPages(request, response);
      response.statusCode.should.eql(500);
    });

    it('should send json response with no pages', function() {
      routes.__get__('page').getNextPages = sinon.stub().callsArgWith(2, null, { noResults: true });

      var request = createGoodRequest();
      var response = http.createResponse();
      getNextPages(request, response);
      response.statusCode.should.eql(200);
      response._isJSON().should.be.true;
      var pageResponse = JSON.parse(response._getData());
      pageResponse.should.have.property('noCatches', true);
    });

    it('should send json response of caught pages', function() {
      var pages = [{ id:1 },{ id:2 }];
      routes.__get__('page').getNextPages = sinon.stub().callsArgWith(2, null, pages);

      var request = createGoodRequest();
      var response = http.createResponse();
      getNextPages(request, response);
      response.statusCode.should.eql(200);
      response._isJSON().should.be.true;
      var pageResponse = JSON.parse(response._getData());
      pageResponse.should.eql(pages);
    });

    it('should throw an error on commit error', function() {
      routes.__get__('db').getConnection = sinon.stub().returns({
        beginTransaction: sinon.stub().callsArg(0),
        commit: sinon.stub().callsArgWith(0, new Error('Commit failure'))
      });
      routes.__get__('db').closeConnection = sinon.stub().callsArg(1);
      routes.__get__('page').getNextPages = sinon.stub().callsArgWith(2, null, { noResults: true });

      var request = createGoodRequest();
      var response = http.createResponse();
      (function() {
        getNextPages(request, response);
      }).should.throw('Commit failure');
    });
  });
});
