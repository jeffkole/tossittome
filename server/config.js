
var config = {
  host: 'localhost:9999'
};

function setup(app) {
  if ('production' == app.get('env')) {
    config.host = 'tossitto.me';
  }
  return config;
}

module.exports = setup;
