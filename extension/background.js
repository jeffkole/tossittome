var tossittome = {
  pageUrl: 'http://localhost:9999/catch?token=w4fCsmIlw4zCsMKMasKGwqQsPEDCjQpzH8Ksw67CvA',
  timeout: null,
  run: true,
  catches: [],

  requestNextPage: function() {
    var req = new XMLHttpRequest();
    req.open("GET", this.pageUrl, true);
    req.addEventListener('load', this.openNextPage.bind(this), false);
    req.addEventListener('error', this.error.bind(this), false);
    req.addEventListener('abort', this.abort.bind(this), false);
    req.send(null);
  },

  openNextPage: function(e) {
    console.log("Response text: " + e.target.responseText);
    var response = JSON.parse(e.target.responseText);
    console.log("Response site: " + response.site);
    chrome.tabs.create({
        'url':    response.site,
        'active': false
      }, function(tab) {
        chrome.windows.update(tab.windowId, {'drawAttention': true});
        response.tabId = tab.id;
        response.windowId = tab.windowId;
      });
    this.saveCatch(response);

    this.timeout = setTimeout(this.loop.bind(this), 1000);
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

  start: function() {
    this.run = true;
    this.loop();

    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
      console.log('sending response');
      console.log(this.catches);
      sendResponse(this.catches);
    }.bind(this));
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

tossittome.start();
