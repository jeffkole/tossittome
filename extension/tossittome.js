window.TossItToMe = window.TossItToMe || {};

window.TossItToMe.Network = (function() {
  var _manifest = chrome.runtime.getManifest();

  var _toParamString = function(params) {
    params = params || {};
    return Object.keys(params).map(function(key) {
      return [ encodeURIComponent(key), encodeURIComponent(params[key]) ].join('=');
    }).join('&');
  };

  var baseUrl = function() {
    return 'http://localhost:9999';
  };

  var _makeUrl = function(uri, params) {
    var url = baseUrl() + uri +
      '?v=' + _manifest.version +
      '&i=' + TossItToMe.ID.getID();
    var query = _toParamString(params);
    if (query) {
      url = url + '&' + query;
    }
    return url;
  };

  var get = function(uri, onLoad, options) {
    options = options || {};
    var request = new XMLHttpRequest();
    // Send cookies
    request.withCredentials = true;
    request.open('GET', _makeUrl(uri, options.queryParams), true);
    request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    request.addEventListener('load', onLoad, false);
    request.send(_toParamString(options.postParams));
  };

  var post = function(uri, onLoad, options) {
    var request = new XMLHttpRequest();
    request.open('POST', _makeUrl(uri, options.queryParams), true);
    request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    request.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
    onLoad = onLoad || function(e) {};
    request.addEventListener('load', onLoad, false);
    request.send(_toParamString(options.postParams));
  };

  return {
    baseUrl : baseUrl,
    get     : get,
    post    : post
  };
}());

window.TossItToMe.ID = (function() {
  // Thank you: http://stackoverflow.com/a/7221797
  var _createGuid = function() {
    var buf = new Uint16Array(8);
    window.crypto.getRandomValues(buf);
    var S4 = function(num) {
      var ret = num.toString(16);
      while (ret.length < 4){
        ret = "0" + ret;
      }
      return ret;
    };
    return (S4(buf[0]) + S4(buf[1]) +
      '-'  + S4(buf[2]) +
      '-4' + S4(buf[3]).substring(1) +
      '-y' + S4(buf[4]).substring(1) +
      '-'  + S4(buf[5]) + S4(buf[6]) + S4(buf[7]));
  };

  var getID = function() {
    var id = localStorage.getItem('TossExtensionID');
    if (typeof id === 'undefined' || id === null) {
      id = _createGuid();
      localStorage.setItem('TossExtensionID', id);
    }
    return id;
  };

  return {
    getID : getID
  };
}());
