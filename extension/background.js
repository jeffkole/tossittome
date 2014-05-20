var tossItToMeBg = {
  tossItToMeUrl: 'http://localhost:9999',
  pageUri: '/catch',
  request: null,

  requestNextPage: function() {
    var manifest = chrome.runtime.getManifest();
    var req = new XMLHttpRequest();
    // Send cookies
    req.withCredentials = true;
    req.open("GET", this.tossItToMeUrl + this.pageUri + '?v=' + manifest.version, true);
    req.addEventListener('load', this.load.bind(this), false);
    req.addEventListener('error', this.error.bind(this), false);
    req.addEventListener('abort', this.abort.bind(this), false);
    req.send(null);
    this.request = req;
  },

  load: function(e) {
    if (e.target.status == 401) {
      // Initiate login
      this.stop();
    }
    else if (e.target.status == 200) {
      var responses = JSON.parse(e.target.responseText);
      if (responses.noCatches) {
        // No catches, so nothing to do
        console.log('No catches... carry on');
      }
      else {
        this.openPages(responses);
      }
    }
    else {
      console.log('Response was errorful');
      this.error(e);
    }
    this.request = null;
  },

  error: function(e) {
    console.log('Response error', e);
    this.request = null;
  },

  abort: function(e) {
    console.log('Response abort', e);
    this.request = null;
  },

  openPages: function(pages) {
    tossItToMeBg.openPagesInWindow(pages, chrome.windows.WINDOW_ID_CURRENT);
    chrome.browserAction.getBadgeText({}, function(text) {
      var num = 0;
      if (text) {
        num = parseInt(text);
      }
      chrome.browserAction.setBadgeText({ text: (num + pages.length).toString() });
    });
  },

  openPagesInWindow: function(pages, windowId) {
    pages.forEach(function(page) {
      console.log("Page url: " + page.url);
      chrome.tabs.create({
        'windowId': windowId,
        'url':      page.url,
        'active':   false
      });
    });
  },

  start: function() {
    console.log('Starting');
    console.log('Creating catcher alarm');
    this.requestNextPage();
    chrome.alarms.create('catcher', { periodInMinutes : 1 });
  },

  stop: function() {
    console.log('Clearing catcher alarm');
    chrome.alarms.clear('catcher');
  }
};

chrome.runtime.onInstalled.addListener(function() {
  console.log('Toss It To Me! installed');
});

chrome.runtime.onSuspend.addListener(function() {
  console.log('About to suspend Toss It To Me!');
  if (tossItToMeBg.request && tossItToMeBg.request.readyState != 4) {
    tossItToMeBg.request.abort();
    tossItToMeBg.request = null;
  }
});

tossItToMeBg.start();
chrome.alarms.onAlarm.addListener(function() {
  tossItToMeBg.requestNextPage();
});
chrome.cookies.onChanged.addListener(function(info) {
  if (!info.removed) {
    // If a cookie was created, then restart the poller
    tossItToMeBg.start();
  }
});
