var fs      = require('fs'),
    hogan   = require('hogan.js'),
    auth    = require('toss/common/auth'),
    config  = require('toss/common/config'),
    db      = require('toss/common/db'),
    userDao = require('toss/user/dao');

function renderHistory(request, response) {

  var connection = db.getConnection();

  connection.query('SELECT title from pages', function(err, result, fields) {
  if(err) 
    {
      throw err;
    }
  else 
    {
      console.log(result);
      response.render('history', {
      result: result 
      });
    }
  });

  db.closeConnection(connection);

}

function setup(app) {
  app.get('/history', renderHistory);
}

module.exports = setup;
