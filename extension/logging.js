window.TossItToMe = window.TossItToMe || {};

window.TossItToMe.Logger = (function() {
  var logLevels = {
    'debug': 0,
    'info' : 1,
    'warn' : 2,
    'error': 3,
    'off'  : 4
  };

  var remoteLogLevel = 'info';

  var overrideConsoleFunction = function(logLevel) {
    var originalFn = console[logLevel];
    console[logLevel] = function() {
      originalFn.apply(console, arguments);

      if (logLevels[logLevel] >= logLevels[remoteLogLevel]) {
        var message = arguments[0];
        var payload = {
          message: message
        };
        if (arguments.length > 1) {
          payload.arguments = Array.prototype.slice.call(arguments, 1);
        }
        TossItToMe.Network.post('/admin/log/' + logLevel, null, {
          queryParams: { 'message': message },
          postParams : { 'payload': JSON.stringify(payload) }
        });
      }
    };
  };

  overrideConsoleFunction('debug');
  overrideConsoleFunction('info');
  overrideConsoleFunction('warn');
  overrideConsoleFunction('error');

  var turnOff = function() {
    remoteLogLevel = 'off';
  };
  var setLogLevel = function(logLevel) {
    remoteLogLevel = logLevel;
  };
  var getLogLevel = function() {
    return remoteLogLevel;
  };

  return {
    turnOff    : turnOff,
    setLogLevel: setLogLevel,
    getLogLevel: getLogLevel
  };
}());

window.onerror = function(message, file, line, column, error) {
  // From stacktrace.js
  var stackTrace = function(e) {
    return (e.stack + '\n')
      .replace(/^[\s\S]+?\s+at\s+/, ' at ') // remove message
      .replace(/^\s+(at eval )?at\s+/gm, '') // remove 'at' and indentation
      .replace(/^([^\(]+?)([\n$])/gm, '{anonymous}() ($1)$2')
      .replace(/^Object.<anonymous>\s*\(([^\)]+)\)/gm, '{anonymous}() ($1)')
      .replace(/^(.+) \((.+)\)$/gm, '$1@$2')
      .split('\n')
      .slice(0, -1);
  };

  var payload = {
    message: message,
    file: file,
    line: line,
    column: column,
    stack: stackTrace(error)
  };
  TossItToMe.Network.post('/admin/log/error', null, {
    queryParams: { 'message': message },
    postParams : { 'payload': JSON.stringify(payload) }
  });

  // False triggers the default handler to run
  return false;
};
