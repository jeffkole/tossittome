var uglify = require('uglify-js'),
    log    = require('toss/common/log');

function minify() {
  return function(request, response, next) {
    var write   = response.write;
    var end     = response.end;
    var buffers = [];

    request.on('close', function() {
      response.write = response.end = function() {};
      log.debug('request close');
    });

    response.write = function(chunk, encoding) {
      if (!this.headerSent) {
        this._implicitHeader();
      }

      if (typeof chunk === 'undefined') {
        return;
      }

      if (typeof chunk === 'string') {
        chunk = new Buffer(chunk, encoding);
      }

      buffers.push(chunk);
    };

    response.end = function(chunk, encoding) {
      var self = this;

      if (typeof chunk !== 'undefined') {
        response.write.apply(self, arguments);
      }

      var buffer = Buffer.concat(buffers);

      var minified = uglify.minify(buffer.toString(encoding), { fromString: true });
      write.call(response, minified.code, 'UTF-8');
      return end.call(response);
    };

    response.on('header', function() {
      response.removeHeader('Content-Length');
    });

    next();
  };
}

module.exports = {
  minify : minify
};
