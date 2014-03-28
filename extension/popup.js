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
          var catches = tossItToMeBg.getCatches();
          console.log('catches:', catches);
          document.getElementById('num_caught').innerText = catches.length.toString();
          var ul = document.getElementById('page_list');
          catches.forEach(function(caught) {
            var li = document.createElement('li');
            var a = document.createElement('a');
            a.innerText = caught.url;
            a.href = '#';
            a.addEventListener('click', function(e) {
              chrome.tabs.update(caught.tabId, {'active': true});
              chrome.windows.update(caught.windowId, {'focused': true});
              e.stopPropogation();
            }, false);
            li.appendChild(a);
            ul.appendChild(li);
          });
          document.getElementById('pages').style.display = 'block';
        }
        else {
          document.getElementById('login').style.display = 'block';
        }
      }.bind(tossItToMePop));
    }.bind(tossItToMePop));
  },

  clearLinks: function(tossItToMeBg) {
    document.getElementById('page_list').innerHTML = '';
    document.getElementById('num_caught').innerText = '0';
    tossItToMeBg.resetCatches();
  },

  login: function(tossItToMeBg) {
    console.log('login attempt');
    var loginForm = document.getElementById('login_form');
    var url = tossItToMeBg.tossItToMeUrl + this.loginUri +
      '?email=' + encodeURIComponent(loginForm.email.value) +
      '&password=' + encodeURIComponent(loginForm.password.value);
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.addEventListener('load', this.processLogin(tossItToMeBg).bind(this), false);
    request.send(null);
  },

  processLogin: function(tossItToMeBg) {
    return function(e) {
      console.log('login!', e);
      if (e.target.status == 200) {
        var cookies = JSON.parse(e.target.responseText);
        console.log('setting cookies:', cookies);
        for (var key in cookies) {
          chrome.cookies.set({
            url   : tossItToMeBg.tossItToMeUrl + '/',
            name  : key,
            value : cookies[key]
          });
        }
        document.getElementById('pages').style.display = 'block';
        document.getElementById('login').style.display = 'none';
        tossItToMeBg.start();
      }
    };
  }
};

document.addEventListener('DOMContentLoaded', function() {
  tossItToMePop.initialize();
});
