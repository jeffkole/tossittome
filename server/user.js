var crypto  = require('crypto'),
    base64  = require('js-base64').Base64;

// Keep cookie active for 1 year
var cookieAge = 1000 * 60 * 60 * 24 * 365;

var dao;

function validatePassword(plain, hashed) {
  return hashPassword(plain, hashed.substring(0, 3)) == hashed;
}

function hashPassword(plain, salt) {
  if (arguments.length == 1) {
    salt = base64.encodeURI(crypto.randomBytes(2));
  }
  var hashed =
    base64.encode(
        crypto.createHash('sha1').
        update(salt).
        update(plain).
        digest('binary'));
  return (salt + hashed);
}

function login(email, password, onSuccessFn, onFailureFn) {
  dao.fetchUserByEmail(email).
    onSuccess(function(user) {
      if (validatePassword(password, user.password)) {
        onSuccessFn(user);
      }
      else {
        console.log('Invalid password');
        onFailureFn();
      }
    }).
    onFailure(onFailureFn).
    run();
}

function logout(response) {
  response.clearCookie('token');
}

function getLogin(request, response) {
  logout(response);
  response.render('login', {
    url   : request.query.url,
    title : request.query.title
  });
}

function xhrLogin(request, response) {
  if (!request.query.email || !request.query.password) {
    response.send(400);
    return;
  }

  var email    = request.query.email;
  var password = request.query.password;

  login(email, password,
      function(user) {
        response.json(200, [
            { name: 'token', value: user.token, expirationDate: (Date.now() + cookieAge) }
          ]);
      },
      function() {
        response.json(200, { invalidUser: true });
      });
}

function postLogin(request, response) {
  console.log('Attempted login with email %s', request.body.email);
  if (!request.body.email || !request.body.password) {
    response.send(400);
    return;
  }

  var email    = request.body.email;
  var password = request.body.password;
  var url      = request.body.url;
  var title    = request.body.title;

  login(email, password,
      function(user) {
        response.cookie('token', user.token, { maxAge: cookieAge });
        if (url && title) {
          response.redirect('/add?url=' + encodeURIComponent(url) + '&title=' + encodeURIComponent(title));
        }
        else {
          response.redirect('/');
        }
      },
      function() {
        response.send(400);
      });
}

function getLogout(request, response) {
  logout(response);
  response.redirect('/');
}

function getRegister(request, response) {
  logout(response);
  response.render('register');
}

function postRegister(request, response) {
  if (!request.body.email || !request.body.password) {
    response.send(400);
    return;
  }

  var email    = request.body.email;
  var password = request.body.password;

  dao.addUser(email, hashPassword(password)).
    onSuccess(function(user) {
      response.cookie('token', user.token, { maxAge: cookieAge });
      response.redirect('/');
    }).
  run();
}

function setup(app, express, auth, _dao) {
  dao = _dao;
  app.get('/login', getLogin);
  app.post('/login', express.bodyParser(), postLogin);

  app.get('/xhr/login', auth.allowOrigin(), xhrLogin);

  app.get('/logout', getLogout);
  app.get('/register', getRegister);
  app.post('/register', express.bodyParser(), postRegister);
}

module.exports = setup;
