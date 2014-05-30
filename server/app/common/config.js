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
  },

  contact: {
    help: {
      email : 'SPECIFIED_IN_A_SECRET_FILE'
    }
  }

};

function setup() {
  var secrets = {};
  if ('production' === process.env.NODE_ENV) {
    config.host = 'tossitto.me';
    config.db.schema = 'tossittome_prod';
    config.log.level = 'INFO';
    config.errors.exposeStack = false;
    config.email.subaccount = 'TossItToMe';

    secrets = require(process.env.HOME + '/.ssh/tossittome/production_secrets.json');
  }
  else if ('beta' === process.env.NODE_ENV) {
    config.port = 9998;
    config.host = 'tossitto.me';
    config.db.schema = 'tossittome_prod';
    config.log.level = 'INFO';
    config.errors.exposeStack = false;

    secrets = require(process.env.HOME + '/.ssh/tossittome/beta_secrets.json');
  }
  else if ('test' === process.env.NODE_ENV) {
    config.db.schema = 'tossittome_test';
    config.log.level = 'ERROR';

    secrets = require(process.env.HOME + '/.ssh/tossittome/test_secrets.json');
  }
  else {
    secrets = require(process.env.HOME + '/.ssh/tossittome/development_secrets.json');
  }
  config = merge(config, secrets);

  return config;
}

module.exports = setup();
