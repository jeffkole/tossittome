var tossItToMePop = {
  initialize: function() {
    document.getElementById('login_form').addEventListener('submit',
      function(e) {
        this.login();
        e.preventDefault();
      }.bind(tossItToMePop), true);

    chrome.cookies.get({
      url  : TossItToMe.Network.baseUrl() + '/',
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
    var onLoad = function(e) {
      if (e.target.status == 401) {
        document.getElementById('login').style.display = 'block';
      }
      else if (e.target.status == 200) {
        document.getElementById('page_list').innerHTML = e.target.responseText;
        Array.prototype.forEach.call(document.querySelectorAll('#page_list a'), function(link) {
          link.addEventListener('click', function(e) {
            TossItToMe.Tabs.activateOrOpen(link.href);
            e.preventDefault();
          }, false);
        });
        document.getElementById('pages').style.display = 'block';
        chrome.browserAction.setBadgeText({ text: '' });
      }
      else {
        console.error('Error fetching history', e.target);
      }
    };

    TossItToMe.Network.get('/page/catches', onLoad);
  },

  login: function() {
    document.getElementById('login_error').style.display = 'none';
    var loginForm = document.getElementById('login_form');
    if (!loginForm.email.value.trim() || !loginForm.password.value.trim()) {
      document.getElementById('login_error').innerText = 'Please enter a valid email and password.';
      document.getElementById('login_error').style.display = 'block';
    }
    else {
      TossItToMe.Network.post('/xhr/login', this.processLogin.bind(this), {
        postParams: {
          'email': loginForm.email.value,
          'password': loginForm.password.value
        }
      });
    }
  },

  processLogin: function(e) {
    var handleInvalidUser = function() {
      document.getElementById('login_error').innerText = 'Invalid email or password. Try again.';
      document.getElementById('login_error').style.display = 'block';
    };

    if (e.target.status === 200) {
      var response = JSON.parse(e.target.responseText);
      if (response.invalidUser) {
        handleInvalidUser();
      }
      else {
        var cookies = response;
        console.debug('setting cookies:', cookies);
        cookies.forEach(function(cookie) {
          chrome.cookies.set({
            url            : TossItToMe.Network.baseUrl() + '/',
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
    else {
      handleInvalidUser();
    }
  }
};

document.addEventListener('DOMContentLoaded', function() {
  tossItToMePop.initialize();
});
