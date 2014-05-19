var tossItToMePop = {
  tossItToMeUrl: 'http://localhost:9999',
  loginUri: '/xhr/login',
  catchHistoryUri: '/page/catches',
  numNewTabs: 0,

  initialize: function() {

    chrome.runtime.getBackgroundPage(function(bgPageWindow) {
      var tossItToMeBg = bgPageWindow.tossItToMeBg;

      document.getElementById('login_form').addEventListener('submit',
        function(e) {
          this.login(tossItToMeBg);
          e.preventDefault();
        }.bind(tossItToMePop), true);

      chrome.cookies.get({
        url  : tossItToMeBg.tossItToMeUrl + '/',
        name : 'token'
      }, function(cookie) {
        if (cookie) {
          this.getCatchHistory();
        }
        else {
          document.getElementById('login').style.display = 'block';
        }
      }.bind(tossItToMePop));
    }.bind(tossItToMePop));
  },

  getCatchHistory: function() {
    var manifest = chrome.runtime.getManifest();
    var url = this.tossItToMeUrl + this.catchHistoryUri + '?v=' + manifest.version;
    var request = new XMLHttpRequest();
    request.withCredentials = true;
    request.open('GET', url, true);
    request.addEventListener('load', function(e) {
      if (e.target.status == 401) {
        // TODO: error out
      }
      else if (e.target.status == 200) {
        document.getElementById('page_list').innerHTML = e.target.responseText;
        Array.prototype.forEach.call(document.querySelectorAll('#page_list a'), function(link) {
          link.addEventListener('click', function(e) {
            chrome.tabs.create({
              'url': link.href,
              'active': true
//            }, function(tab) {
//              chrome.tabs.executeScript(tab.id, {
//                code: "document.body.style.backgroundColor = 'red'; var d = document.createElement('h1'); d.innerText = 'Caught!'; document.body.appendChild(d);"
//            });
            });
            e.preventDefault();
          }, false);
        });
        document.getElementById('pages').style.display = 'block';
      }
      else {
        // TODO: error?
      }
    }.bind(this), false);
    request.send(null);
  },

  login: function(tossItToMeBg) {
    console.log('login attempt');
    document.getElementById('login_error').style.display = 'none';
    var loginForm = document.getElementById('login_form');
    if (!loginForm.email.value.trim() || !loginForm.password.value.trim()) {
      document.getElementById('login_error').innerText = 'Please enter a valid email and password.';
      document.getElementById('login_error').style.display = 'block';
    }
    else {
      var manifest = chrome.runtime.getManifest();
      var url = tossItToMeBg.tossItToMeUrl + this.loginUri + '?v=' + manifest.version;
      var params =
        '&email=' + encodeURIComponent(loginForm.email.value) +
        '&password=' + encodeURIComponent(loginForm.password.value);
      var request = new XMLHttpRequest();
      request.open('POST', url, true);
      request.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
      request.addEventListener('load', this.processLogin(tossItToMeBg).bind(this), false);
      request.send(params);
    }
  },

  processLogin: function(tossItToMeBg) {
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
              url            : tossItToMeBg.tossItToMeUrl + '/',
              name           : cookie.name,
              value          : cookie.value,
              // Chrome uses seconds, not milliseconds for cookies
              expirationDate : (cookie.expirationDate / 1000)
            });
          });
          document.getElementById('pages').style.display = 'block';
          document.getElementById('login').style.display = 'none';
        }
      }
    };
  }
};

document.addEventListener('DOMContentLoaded', function() {
  tossItToMePop.initialize();
});
