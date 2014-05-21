window.tossLogger = (function() {

  var logLevels = {
    'debug': 0,
    'info' : 1,
    'warn' : 2,
    'error': 3,
    'off'  : 4
  };

  var remoteLogLevel = 'info';

  var manifest = chrome.runtime.getManifest();
  var url = function(level, message) {
    return 'http://localhost:9999/admin/log/' + level + '?v=' + manifest.version + '&message=' + encodeURIComponent(message);
  };

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
        var request = new XMLHttpRequest();
        request.open('POST', url(logLevel, message), true);
        request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        request.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
        request.send('payload=' + encodeURIComponent(JSON.stringify(payload)));
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

window.onerror = function(message, url, line, column, error) {
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
    url: url,
    line: line,
    column: column,
    stack: stackTrace(error)
  };
  var manifest = chrome.runtime.getManifest();
  var tossItToMeUrl = 'http://localhost:9999/admin/error?v=' + manifest.version + '&message=' + encodeURIComponent(message);
  var request = new XMLHttpRequest();
  request.open('POST', tossItToMeUrl, true);
  request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  request.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
  request.send('payload=' + encodeURIComponent(JSON.stringify(payload)));

  // False triggers the default handler to run
  return false;
};
