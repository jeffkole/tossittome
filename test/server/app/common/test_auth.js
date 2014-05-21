var http   = require('node-mocks-http'),
    rewire = require('rewire'),
    should = require('should'),
    sinon  = require('sinon'),
    util   = require('test/util');

var auth   = rewire('toss/common/auth');

describe('Auth', function() {
  describe('#protect', function() {
    var token = 'AAAA';
    var createRequestWithCookie = function() {
      return http.createRequest({
        cookies: { token: token }
      });
    };

    beforeEach(function() {
      var dbMock = {
        getConnection: sinon.stub(),
        closeConnection: sinon.stub()
      };
      var userDaoMock = {
        fetchUserByToken: sinon.stub()
      };
      auth.__set__('db', dbMock);
      auth.__set__('userDao', userDaoMock);
    });

    it('should send 500 on error during user fetch', function() {
      var userDaoMock = {
        fetchUserByToken: sinon.stub().callsArgWith(2, new Error('Connection error'))
      };
      auth.__set__('userDao', userDaoMock);

      var request = createRequestWithCookie();
      var response = http.createResponse();
      var protect = auth.protect(true);
      var next = sinon.spy();
      protect(request, response, next);
      next.called.should.eql(false);
      response.statusCode.should.eql(500);
    });

    it('should clear the cookie if the user is not found by the token', function() {
      var userDaoMock = {
        fetchUserByToken: sinon.stub().callsArgWith(2, null, { noResults: true })
      };
      auth.__set__('userDao', userDaoMock);

      var request = createRequestWithCookie();
      // Mock request does not have an originalUrl field, so create it
      request.originalUrl = '/desired-location';
      var response = http.createResponse();
      var protect = auth.protect(true);
      var next = sinon.spy();
      protect(request, response, next);
      next.called.should.eql(false);
      should.not.exist(response.cookies.token);
      response._getRedirectUrl().should.eql('/login?url=%2Fdesired-location');
    });

    it('should clear the cookie and call next if the user is not found by the token', function() {
      var userDaoMock = {
        fetchUserByToken: sinon.stub().callsArgWith(2, null, { noResults: true })
      };
      auth.__set__('userDao', userDaoMock);

      var request = createRequestWithCookie();
      // Mock request does not have an originalUrl field, so create it
      request.originalUrl = '/desired-location';
      var response = http.createResponse();
      var protect = auth.protect(false);
      var next = sinon.spy();
      protect(request, response, next);
      next.called.should.eql(true);
      should.not.exist(response.cookies.token);
    });

    it('should set the user in the response locals if found', function() {
      var user = { id: 1, token: token };
      var userDaoMock = {
        fetchUserByToken: sinon.stub().callsArgWith(2, null, user)
      };
      auth.__set__('userDao', userDaoMock);

      var request = createRequestWithCookie();
      var response = http.createResponse();
      // Mock response does not have a locals object, so create one
      response.locals = {};
      var protect = auth.protect(true);
      var next = sinon.spy();
      protect(request, response, next);
      next.called.should.eql(true);
      response.locals.should.have.property('user', user);
    });

    it('should redirect when requested if no cookie', function() {
      var request = http.createRequest();
      // Mock request does not have an originalUrl field, so create it
      request.originalUrl = '/desired-location';
      var response = http.createResponse();
      var protect = auth.protect(true);
      var next = sinon.spy();
      protect(request, response, next);
      next.called.should.eql(false);
      response._getRedirectUrl().should.eql('/login?url=%2Fdesired-location');
    });

    it('should call next() if not redirecting', function() {
      var request = http.createRequest();
      var response = http.createResponse();
      var protect = auth.protect(false);
      var next = sinon.spy();
      protect(request, response, next);
      next.called.should.eql(true);
    });

    it('should default to redirect', function() {
      var request = http.createRequest();
      // Mock request does not have an originalUrl field, so create it
      request.originalUrl = '/desired-location';
      var response = http.createResponse();
      var protect = auth.protect();
      var next = sinon.spy();
      protect(request, response, next);
      next.called.should.eql(false);
      response._getRedirectUrl().should.eql('/login?url=%2Fdesired-location');
    });

    // Cannot test this because the mock request does not play nicely with
    // Express' xhr function, which calls `this.get` internally.
    /*
    it('should send 401 error for XHR requests instead of redirecting', function() {
      var request = http.createRequest({
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });
      var response = http.createResponse();
      var protect = auth.protect();
      var next = sinon.spy();
      protect(request, response, next);
      next.called.should.eql(false);
      response.statusCode.should.eql(401);
    });
    */
  });

  describe('#allowOrigin', function() {
    var completeRequest = function(request, origin) {
      // Mock request has no get function
      request.get = function(header) {
        return origin;
      };
      return request;
    };
    var completeResponse = function(response) {
      // Mock response has no set function
      response.set = function(headers) {
        Object.keys(headers).forEach(function(name) {
          response.setHeader(name, headers[name]);
        });
      };
      return response;
    };

    it('should set Access-Control headers if origin is set', function() {
      var origin = 'http://tossitto.me';
      var request = completeRequest(http.createRequest(), origin);
      var response = completeResponse(http.createResponse());
      var next = sinon.spy();
      var allowOrigin = auth.allowOrigin();
      allowOrigin(request, response, next);
      next.called.should.eql(true);
      response.getHeader('Access-Control-Allow-Origin').should.eql(origin);
      response.getHeader('Access-Control-Allow-Credentials').should.eql('true');
    });

    it('should not set Access-Control headers for chrome extension if requested from non-Chrome extension', function() {
      var origin = 'http://tossitto.me';
      var request = completeRequest(http.createRequest(), origin);
      var response = completeResponse(http.createResponse());
      var next = sinon.spy();
      var allowOrigin = auth.allowOrigin(true);
      allowOrigin(request, response, next);
      next.called.should.eql(true);
      should.not.exist(response.getHeader('Access-Control-Allow-Origin'));
      should.not.exist(response.getHeader('Access-Control-Allow-Credentials'));
    });

    it('should set Access-Control headers for chrome extension if requested from Chrome extension', function() {
      var origin = 'chrome-extension://1234567890';
      var request = completeRequest(http.createRequest(), origin);
      var response = completeResponse(http.createResponse());
      var next = sinon.spy();
      var allowOrigin = auth.allowOrigin(true);
      allowOrigin(request, response, next);
      next.called.should.eql(true);
      response.getHeader('Access-Control-Allow-Origin').should.eql(origin);
      response.getHeader('Access-Control-Allow-Credentials').should.eql('true');
    });

    it('should always call next()', function() {
      var request = http.createRequest();
      // Mock request has no get function
      request.get = function(header) {
        return '';
      };
      var response = http.createResponse();
      var next = sinon.spy();
      var allowOrigin = auth.allowOrigin();
      allowOrigin(request, response, next);
      next.called.should.eql(true);
    });
  });
});
