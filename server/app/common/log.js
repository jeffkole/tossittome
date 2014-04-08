var Log     = require('log'),
    config  = require('toss/common/config');

function setup() {
  var logger = new Log(Log[config.log.level]);
  return logger;
}

module.exports = setup();
