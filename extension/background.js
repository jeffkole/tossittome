var tossItToMeBg = {
  tossItToMeUrl: 'http://{{ hostAndPort }}',
  pageUri: '/catch',
  timeout: null,
  run: false,
  catches: [],

  requestNextPage: function() {
    var req = new XMLHttpRequest();
    // Send cookies
    req.withCredentials = true;
    req.open("GET", this.tossItToMeUrl + this.pageUri, true);
    req.addEventListener('load', this.openNextPage.bind(this), false);
    req.addEventListener('error', this.error.bind(this), false);
    req.addEventListener('abort', this.abort.bind(this), false);
    req.send(null);
  },

  openNextPage: function(e) {
    console.log('response:', e.target);
    if (e.target.status == 401) {
      // Initiate login
      console.log('unauthorized');
      this.stop();
    }
    else if (e.target.status == 200) {
      console.log("Response text: " + e.target.responseText);
      var response = JSON.parse(e.target.responseText);
      if (response.noCatches) {
        console.log('No catches... carry on');
      }
      else {
        console.log("Response url: " + response.url);
        chrome.tabs.create({
          'url':    response.url,
          'active': false
        }, function(tab) {
          chrome.windows.update(tab.windowId, {'drawAttention': true});
          response.tabId = tab.id;
          response.windowId = tab.windowId;
        });
        this.saveCatch(response);
      }
      this.timeout = setTimeout(this.loop.bind(this), 1000);
    }
    else {
      console.log('Response was errorful');
      this.error(e);
    }
  },

  error: function(e) {
    console.log("Response error: " + e);
    this.timeout = setTimeout(this.loop.bind(this), 1000);
  },

  abort: function(e) {
    console.log("Response abort: " + e);
    this.timeout = setTimeout(this.loop.bind(this), 1000);
  },

  saveCatch: function(response) {
    this.catches.push(response);
    this.setBadge(this.catches.length);
  },

  setBadge: function(num) {
    chrome.browserAction.setBadgeText({'text': num.toString()});
  },

  getCatches: function() {
    return this.catches;
  },

  resetCatches: function() {
    this.catches = [];
    this.setBadge('');
  },

  start: function() {
    if (!this.run) {
      this.run = true;
      this.loop();
    }
  },

  loop: function() {
    if (this.run) {
      this.requestNextPage();
    }
  },

  stop: function() {
    this.run = false;
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }
}

tossItToMeBg.start();
