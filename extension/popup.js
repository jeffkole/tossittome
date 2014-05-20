var tossItToMePop = {
  tossItToMeUrl: 'http://localhost:9999',
  loginUri: '/xhr/login',
  catchHistoryUri: '/page/catches',
  numNewTabs: 0,

  initialize: function() {
    document.getElementById('login_form').addEventListener('submit',
      function(e) {
        this.login();
        e.preventDefault();
      }.bind(tossItToMePop), true);

    chrome.cookies.get({
      url  : this.tossItToMeUrl + '/',
      name : 'token'
    }, function(cookie) {
      if (cookie) {
        this.getCatchHistory();
      }
      else {
        document.getElementById('login').style.display = 'block';
      }
    }.bind(tossItToMePop));
  },

  getCatchHistory: function() {
    var manifest = chrome.runtime.getManifest();
    var url = this.tossItToMeUrl + this.catchHistoryUri + '?v=' + manifest.version;
    var request = new XMLHttpRequest();
    request.withCredentials = true;
    request.open('GET', url, true);
    request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    request.addEventListener('load', function(e) {
      if (e.target.status == 401) {
        document.getElementById('login').style.display = 'block';
      }
      else if (e.target.status == 200) {
        document.getElementById('page_list').innerHTML = e.target.responseText;
        Array.prototype.forEach.call(document.querySelectorAll('#page_list a'), function(link) {
          link.addEventListener('click', function(e) {
            // Look for the tab to see if it is already open
            // Remove any hash content, since that ruins Chrome's matching
            // algorithm
            var url = link.href;
            var hashIndex = url.indexOf('#');
            if (hashIndex > -1) {
              url = url.substring(0, hashIndex);
            }
            chrome.tabs.query({ 'url': url }, function(tabs) {
              if (tabs.length > 0) {
                var tab = tabs[0];
                chrome.tabs.update(tab.id, { active: true });
                chrome.windows.update(tab.windowId, { focused: true });
              }
              else {
                // Open the page in a new tab if it is not found
                chrome.tabs.create({
                  'url': link.href,
                  'active': true
                });
              }
            });
            e.preventDefault();
          }, false);
        });
        document.getElementById('pages').style.display = 'block';
        chrome.browserAction.setBadgeText({ text: '' });
      }
      else {
        console.log('Error fetching history', e.target);
      }
    }.bind(this), false);
    request.send(null);
  },

  login: function() {
    console.log('login attempt');
    document.getElementById('login_error').style.display = 'none';
    var loginForm = document.getElementById('login_form');
    if (!loginForm.email.value.trim() || !loginForm.password.value.trim()) {
      document.getElementById('login_error').innerText = 'Please enter a valid email and password.';
      document.getElementById('login_error').style.display = 'block';
    }
    else {
      var manifest = chrome.runtime.getManifest();
      var url = this.tossItToMeUrl + this.loginUri + '?v=' + manifest.version;
      var params =
        '&email=' + encodeURIComponent(loginForm.email.value) +
        '&password=' + encodeURIComponent(loginForm.password.value);
      var request = new XMLHttpRequest();
      request.open('POST', url, true);
      request.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
      request.addEventListener('load', this.processLogin().bind(this), false);
      request.send(params);
    }
  },

  processLogin: function() {
    return function(e) {
      console.log('login!', e);
      if (e.target.status == 200) {
        var response = JSON.parse(e.target.responseText);
        if (response.invalidUser) {
          document.getElementById('login_error').innerText = 'Invalid email or password. Try again.';
          document.getElementById('login_error').style.display = 'block';
        }
        else {
          var cookies = response;
          console.log('setting cookies:', cookies);
          cookies.forEach(function(cookie) {
            chrome.cookies.set({
              url            : this.tossItToMeUrl + '/',
              name           : cookie.name,
              value          : cookie.value,
              // Chrome uses seconds, not milliseconds for cookies
              expirationDate : (cookie.expirationDate / 1000)
            });
          });
          document.getElementById('login').style.display = 'none';
          this.getCatchHistory();
        }
      }
    };
  }
};

document.addEventListener('DOMContentLoaded', function() {
  tossItToMePop.initialize();
});
