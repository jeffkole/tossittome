var crypto  = require('crypto'),
    base64  = require('js-base64').Base64;

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

function login(email, password, page, response) {
  var failureFn = function() {
    response.send(400);
  };

  dao.fetchUserByEmail(email).
    onSuccess(function(user) {
      if (validatePassword(password, user.password)) {
        response.cookie('token', user.token);
        if (page) {
          response.redirect('/add?page=' + encodeURIComponent(page));
        }
        else {
          response.redirect('/bookmarklet');
        }
      }
      else {
        console.log('Invalid password: %s', password);
        failureFn();
      }
    }).
    onFailure(failureFn).
    run();
}

function logout(response) {
  response.clearCookie('token');
}

function getLogin(request, response) {
  logout(response);
  response.render('login', {
    page: request.query.page
  });
}

function postLogin(request, response) {
  console.log('Attempted login with %j', request.body);
  if (!request.body.email || !request.body.password) {
    response.send(400);
    return;
  }

  var email    = request.body.email;
  var password = request.body.password;
  var page     = request.body.page;

  login(email, password, page, response);
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
      response.cookie('token', user.token);
      response.redirect('/bookmarklet');
    }).
  run();
}

function setup(app, _dao) {
  dao = _dao;
  app.get('/login', getLogin);
  app.post('/login', postLogin);
  app.get('/logout', getLogout);
  app.get('/register', getRegister);
  app.post('/register', postRegister);
}

module.exports = setup;
