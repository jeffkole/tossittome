
var config = {
  host: 'localhost:9999',

  db: {
    host     : 'localhost',
    user     : 'tossittome',
    password : 'password',
    schema   : 'tossittome'
  }

};

function setup(app) {
  if ('production' == app.get('env')) {
    config.host = 'tossitto.me';

    config.db.host     = 'bigdbmachine.tossitto.me';
    config.db.password = 'secure_password';
  }
  return config;
}

module.exports = setup;
