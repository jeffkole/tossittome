var config = require('toss/common/config'),
    log    = require('toss/common/log');

function fourOhFourHandler() {
  return function(request, response, next) {
    response.status(404);

    if (request.accepts('html')) {
      response.render('404', {
        url: request.url
      });
    }
    else if (request.accepts('json')) {
      response.json({ error: 'Not found' });
    }
    else {
      response
        .type('txt')
        .send('Not found');
    }
  };
}

function errorHandler() {
  return function(error, request, response, next) {
    response.status(error.status || 500);

    log.error(error.stack || error.toString());
    if (response.headerSent) {
      return request.socket.destroy();
    }

    if ('HEAD' == request.method) {
      return response.end();
    }

    var locals = { error: {
      name: error.name,
      message: error.message,
      type: error.type
    }};
    if (config.errors.exposeStack) {
      locals.error.stack = error.stack;
    }

    if (request.accepts('html')) {
      response.render('error', locals);
    }
    else if (request.accepts('json')) {
      response.json(locals);
    }
    else {
      response
        .type('txt')
        .send(error.toString());
    }
  };
}

module.exports = {
  fourOhFourHandler   : fourOhFourHandler,
  errorHandler        : errorHandler
};
