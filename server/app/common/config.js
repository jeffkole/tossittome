var merge = require('object-merge');

var config = {
  host: 'localhost:9999',
  port: 9999,

  db: {
    host     : 'localhost',
    user     : 'tossittome',
    password : 'password',
    schema   : 'tossittome'
  },

  log: {
    level    : 'DEBUG'
  },

  errors: {
    exposeStack : true
  },

  email: {
    api_key    : 'SPECIFIED_IN_A_SECRET_FILE',
    subaccount : 'TossItToMeDevelopment'
  }

};

function setup() {
  if ('production' === process.env.NODE_ENV) {
    config.host = 'tossitto.me';
    config.db.schema = 'tossittome_prod';
    config.log.level = 'INFO';
    config.errors.exposeStack = false;
    config.email.subaccount = 'TossItToMe';

    production = require(process.env.HOME + '/.ssh/tossittome/production_secrets.json');
    config = merge(config, production);
  }
  else if ('test' === process.env.NODE_ENV) {
    config.db.schema = 'tossittome_test';
    config.log.level = 'ERROR';

    test = require(process.env.HOME + '/.ssh/tossittome/test_secrets.json');
    config = merge(config, test);
  }
  else {
    development = require(process.env.HOME + '/.ssh/tossittome/development_secrets.json');
    config = merge(config, development);
  }

  return config;
}

module.exports = setup();
