var tossItToMePop = {
  loginUri: '/xhr/login',
  numNewTabs: 0,

  initialize: function() {

    chrome.runtime.getBackgroundPage(function(bgPageWindow) {
      var tossItToMeBg = bgPageWindow.tossItToMeBg;

      document.getElementById('clear_link').addEventListener('click',
        function(e) {
          this.clearLinks(tossItToMeBg);
          e.stopPropogation();
        }.bind(tossItToMePop), false);

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
          tossItToMeBg.withCatches(function(catches) {
            console.log('catches:', catches);
            if (catches.length == 1) {
              document.getElementById('num_caught').innerText = catches.length.toString() + ' page';
            }
            else {
              document.getElementById('num_caught').innerText = catches.length.toString() + ' pages';
            }
            var ul = document.getElementById('page_list');
            catches.forEach(function(caught) {
              var li = document.createElement('li');
              var a = document.createElement('a');
              a.innerText = caught.title || caught.url;
              a.href = caught.url;
              a.addEventListener('click', function(e) {
                chrome.tabs.update(caught.tabId, {'active': true});
                chrome.windows.update(caught.windowId, {'focused': true});
                e.stopPropogation();
              }, false);
              li.appendChild(a);
              if (caught.tosser && caught.tosser.email) {
                li.appendChild(document.createTextNode(' from ' + caught.tosser.email));
              }
              ul.appendChild(li);
            });
            document.getElementById('pages').style.display = 'block';
          });
        }
        else {
          document.getElementById('login').style.display = 'block';
        }
      }.bind(tossItToMePop));
    }.bind(tossItToMePop));
  },

  clearLinks: function(tossItToMeBg) {
    document.getElementById('page_list').innerHTML = '';
    document.getElementById('num_caught').innerText = '0 pages';
    tossItToMeBg.resetCatches();
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
