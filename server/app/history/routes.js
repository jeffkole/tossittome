var moment  = require('moment'),
    ent     = require('ent'),
    auth    = require('toss/common/auth'),
    config  = require('toss/common/config'),
    db      = require('toss/common/db'),
    userDao = require('toss/user/dao');

var dateFormat = 'ddd MMM DD [at] h:mma'

function formatDate(date) {
  if (date) {
    date = moment(date).format(dateFormat)
  }
  else {
    date = "Not caught yet!"
  }
  return date
}

function formatResult(result, user) {
  result.forEach(function(x){
    x.created_at = formatDate(x.created_at) 
    x.served_at = formatDate(x.served_at) 
    x.title = ent.decode(x.title)
    if (user.id == x.user_id) {
      x.user_id = "You"
    }
    if (user.id == x.catcher_id) {
      x.catcher_id = "You"
    }
    else {
      x.catcher_id = x.catcher_email
    }
  })
}

function renderHistory(request, response, user) {

  var connection = db.getConnection();

  connection.query('SELECT p.*, u.email as catcher_email FROM pages p JOIN users u on p.catcher_id = u.id WHERE p.user_id = ' + user.id + ' OR p.catcher_id = ' + user.id, function(err, result, fields) {
  if(err) 
    {
      throw err;
    }
  else 
    {
      formatResult(result, user)
      console.log(result)
      response.render('history', {
        result : result
      });
    }
  });
  
  db.closeConnection(connection);

}

function getHistory(request, response) {
  if (request.cookies.token) {
    var connection = db.getConnection();
    userDao.fetchUserByToken(connection, request.cookies.token, function(error, user) {
      if (error) {
        response.send(500, error);
      }
      else if (user.noResults) {
        response.clearCookie('token');
        response.redirect('/');
      }
      else {
        renderHistory(request, response, user)
      }
      db.closeConnection(connection);
    });
  }
  else {
    response.redirect('/');
  }
}


function setup(app) {
  app.get('/history', getHistory);
}

module.exports = setup;
