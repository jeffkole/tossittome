var auth     = require('toss/common/auth'),
    db       = require('toss/common/db'),
    log      = require('toss/common/log'),
    login    = require('toss/user/login'),
    register = require('toss/user/register');

// Keep cookie active for 1 year
var cookieAge = 1000 * 60 * 60 * 24 * 365;

function logout(response) {
  response.clearCookie('token');
}

function getLogin(request, response) {
  logout(response);
  response.render('login', {
    url : request.query.url
  });
}

function xhrLogin(request, response) {
  if (!request.body.email || !request.body.password) {
    response.send(400);
    return;
  }

  var email    = request.body.email;
  var password = request.body.password;

  var connection = db.getConnection();
  login.authenticate(connection, email, password, function(error, user) {
    if (error) {
      response.send(500, error);
    }
    else if (user.noResults) {
      response.json(200, { invalidUser: true });
    }
    else if (user.invalidPassword) {
      response.json(200, { invalidUser: true });
    }
    else {
      response.cookie('token', user.token, { maxAge: cookieAge });
      response.json(200, [
        { name: 'token', value: user.token, expirationDate: (Date.now() + cookieAge) }
      ]);
    }
    db.closeConnection(connection);
  });
}

function postLogin(request, response) {
  log.info('Attempted login with email "%s"', request.body.email);
  if (!request.body.email || !request.body.password) {
    response.render('login', {
      error : true,
      url   : request.body.url
    });
    return;
  }

  var email    = request.body.email;
  var password = request.body.password;
  var url      = request.query.url;

  var connection = db.getConnection();
  login.authenticate(connection, email, password, function(error, user) {
    if (error) {
      response.send(500, error);
    }
    else if (user.noResults) {
      response.render('login', {
        error : true
      });
    }
    else if (user.invalidPassword) {
      response.render('login', {
        error : true
      });
    }
    else {
      response.cookie('token', user.token, { maxAge: cookieAge });
      if (url) {
        response.redirect(url);
      }
      else {
        response.redirect('/');
      }
    }
    db.closeConnection(connection);
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
    response.render('register', {
      error: {
        invalidEmail: true
      }
    });
    return;
  }

  var email    = request.body.email;
  var password = request.body.password;
  var url      = request.query.url;

  var connection = db.getConnection();
  register.addUser(connection, email, password, function(error, user) {
    if (error) {
      response.send(500, error);
    }
    else if (user.duplicateEmail) {
      response.render('register', {
        error: {
          duplicateEmail: true
        }
      });
    }
    else {
      response.cookie('token', user.token, { maxAge: cookieAge });
      if (url) {
        response.redirect(url);
      }
      else {
        response.redirect('/');
      }
    }
    db.closeConnection(connection);
  });
}

function setup(app, express) {
  app.get('/login', getLogin);
  app.post('/login', express.bodyParser(), postLogin);

  app.post('/xhr/login', express.bodyParser(), auth.allowOrigin(), xhrLogin);

  app.get('/logout', getLogout);
  app.get('/register', getRegister);
  app.post('/register', express.bodyParser(), postRegister);
}

module.exports = setup;
