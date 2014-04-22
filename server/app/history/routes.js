var fs      = require('fs'),
    hogan   = require('hogan.js'),
    auth    = require('toss/common/auth'),
    config  = require('toss/common/config'),
    db      = require('toss/common/db'),
    userDao = require('toss/user/dao');

function getHistory(request, response) {
  renderHistory(request, response);
}

function renderHistory(request, response) {

var pages = {
  "tosses" : [
        {
          "title": "x",
        },
        {
          "title": "y",
        }
      ]
}

console.log(pages);
pages = JSON.stringify(pages);
console.log(pages);

  var connection = db.getConnection();

  connection.query('SELECT title from pages', function(err, result, fields) {
  if(err) 
  {
    throw err;
  }
  else 
  {
    for (var i in result) 
    {
      console.log(result[i]);
    }
  }
  });

  db.closeConnection(connection);

  response.render('history', {
  tosses : pages 
  });
}

function setup(app) {
  app.get('/history', getHistory);
}

module.exports = setup;
