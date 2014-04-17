var merge = require('object-merge');

var config = {
  port: 9999,

  db: {
    host     : 'localhost',
    user     : 'tossittome',
    password : 'password',
    schema   : 'tossittome'
  },

  log: {
    level    : 'INFO'
  },

  errors: {
    exposeStack : true
  }

};

function setup() {
  if ('production' == process.env.NODE_ENV) {
    config.db.schema = 'tossittome_prod';
    config.errors.exposeStack = false;

    production = require(process.env.HOME + '/.ssh/tossittome/production_secrets.json');
    config = merge(config, production);
  }
  if ('test' == process.env.NODE_ENV) {
    config.db.schema = 'tossittome_test';

    config.log.level = 'ERROR';
  }
  return config;
}

module.exports = setup();
