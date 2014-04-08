var http   = require('node-mocks-http'),
    rewire = require('rewire'),
    should = require('should'),
    sinon  = require('sinon');

var routes = rewire('toss/page/routes');

describe('PageRoutes', function() {
  describe('GET /toss', function() {
    var tosser = routes.__get__('tosser');
    var token = 'AAAA';
    var createGoodRequest = function() {
      return http.createRequest({
        cookies: { token: token },
        query: {
          t: token,
          u: 'http://tossitto.me',
          i: 'TossItToMe'
        }
      });
    };

    beforeEach(function() {
      var dbMock = {
        getConnection: sinon.stub(),
        closeConnection: sinon.stub()
      };
      var tossMock = {
        addPage: sinon.stub()
      };
      routes.__set__('db', dbMock);
      routes.__set__('page', tossMock);
    });

    it('should render toss_login.js when no token is in the cookie', function() {
      var request = http.createRequest({});
      var response = http.createResponse();
      tosser(request, response);
      response._getRenderView().should.eql('toss_login.js');
    });

    it('should send a 400 response when the required params are missing', function() {
      var request = http.createRequest({
        cookies: { token: token },
        query: {}
      });
      var response = http.createResponse();
      tosser(request, response);
      response.statusCode.should.eql(400);
    });

    it('should render toss_login.js when tokens are mismatched', function() {
      var request = http.createRequest({
        cookies: { token: token },
        query: {
          t: 'BBBB',
          u: 'http://tossitto.me',
          i: 'TossItToMe'
        }
      });
      var response = http.createResponse();
      tosser(request, response);
      response._getRenderView().should.eql('toss_login.js');
    });

    it('should send 500 on connection failure', function() {
      routes.__get__('page').addPage = sinon.stub().callsArgWith(4, new Error('Connection failure'));

      var request = createGoodRequest();
      var response = http.createResponse();
      tosser(request, response);
      response.statusCode.should.eql(500);
    });

    it('should send 400 when no results', function() {
      routes.__get__('page').addPage = sinon.stub().callsArgWith(4, null, { noResults: true });

      var request = createGoodRequest();
      var response = http.createResponse();
      tosser(request, response);
      response.statusCode.should.eql(400);
    });

    it('should render toss_response.js on success', function() {
      routes.__get__('page').addPage = sinon.stub().callsArgWith(4, null, { id: 1 });

      var request = createGoodRequest();
      var response = http.createResponse();
      tosser(request, response);
      response._getRenderView().should.eql('toss_response.js');
    });
  });

  describe('GET /catch', function() {
    var catcher = routes.__get__('catcher');
    var token = 'AAAA';
    var createGoodRequest = function() {
      return http.createRequest({
        cookies: { token: token }
      });
    };

    beforeEach(function() {
      var dbMock = {
        getConnection: function() {
          return {
            beginTransaction: sinon.stub().callsArg(0),
            commit: sinon.stub().callsArg(0)
          };
        },
        closeConnection: sinon.stub()
      };
      var tossMock = {
        getNextPages: sinon.stub()
      };
      routes.__set__('db', dbMock);
      routes.__set__('page', tossMock);
    });

    it('should send a 401 response when no token is in the cookie', function() {
      var request = http.createRequest({});
      var response = http.createResponse();
      catcher(request, response);
      response.statusCode.should.eql(401);
      response._getData().should.eql('Not authorized');
    });

    it('should send a 500 response on transaction failure', function() {
      var dbMock = {
        getConnection: function() {
          return {
            beginTransaction: sinon.stub().callsArgWith(0, new Error('Transaction failure'))
          };
        },
        closeConnection: sinon.stub()
      };
      routes.__set__('db', dbMock);

      var request = createGoodRequest();
      var response = http.createResponse();
      catcher(request, response);
      response.statusCode.should.eql(500);
    });

    it('should send a 500 response on connection failure', function() {
      routes.__get__('page').getNextPages = sinon.stub().callsArgWith(2, new Error('Connection failure'));

      var request = createGoodRequest();
      var response = http.createResponse();
      catcher(request, response);
      response.statusCode.should.eql(500);
    });

    it('should send json response with no pages', function() {
      routes.__get__('page').getNextPages = sinon.stub().callsArgWith(2, null, { noResults: true });

      var request = createGoodRequest();
      var response = http.createResponse();
      catcher(request, response);
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
      catcher(request, response);
      response.statusCode.should.eql(200);
      response._isJSON().should.be.true;
      var pageResponse = JSON.parse(response._getData());
      pageResponse.should.eql(pages);
    });

    it('should throw an error on commit error', function() {
      var dbMock = {
        getConnection: function() {
          return {
            beginTransaction: sinon.stub().callsArg(0),
            commit: sinon.stub().callsArgWith(0, new Error('Commit failure'))
          };
        },
        closeConnection: sinon.stub().callsArg(1)
      };
      routes.__set__('db', dbMock);
      routes.__get__('page').getNextPages = sinon.stub().callsArgWith(2, null, { noResults: true });

      var request = createGoodRequest();
      var response = http.createResponse();
      (function() {
        catcher(request, response);
      }).should.throw('Commit failure');
    });
  });
});
