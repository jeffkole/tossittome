var merge = require('object-merge');

var config = {
  host: 'localhost:9999',
  port: 9999,

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

    config.db.schema   = 'tossittome_prod';

    production = require(process.env.HOME + '/.ssh/tossittome/production_secrets.json');
    config = merge(config, production);
  }
  return config;
}

module.exports = setup;
