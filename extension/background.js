var tossItToMeBg = {
  tossItToMeUrl: 'http://{{ hostAndPort }}',
  pageUri: '/catch',
  request: null,

  requestNextPage: function() {
    console.log('request next page');
    var req = new XMLHttpRequest();
    // Send cookies
    req.withCredentials = true;
    req.open("GET", this.tossItToMeUrl + this.pageUri, true);
    req.addEventListener('load', this.openNextPage.bind(this), false);
    req.addEventListener('error', this.error.bind(this), false);
    req.addEventListener('abort', this.abort.bind(this), false);
    req.send(null);
    this.request = req;
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
        // No catches, so nothing to do
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

  saveCatch: function(response) {
    chrome.storage.local.get('catches', function(catches) {
      if (chrome.runtime.lastError) { throw chrom.runtime.lastError; }
      console.log('catches', catches);
      if (catches.catches) {
        catches.catches.push(response);
        chrome.storage.local.set(catches);
        this.setBadge(catches.catches.length);
      }
    }.bind(this));
  },

  setBadge: function(num) {
    chrome.browserAction.setBadgeText({'text': num.toString()});
  },

  withCatches: function(doWithCatches) {
    chrome.storage.local.get('catches', function(catches) {
      if (chrome.runtime.lastError) { throw chrom.runtime.lastError; }
      doWithCatches(catches.catches);
    });
  },

  resetCatches: function() {
    chrome.storage.local.set({'catches': []}, function() {
      if (chrome.runtime.lastError) { throw chrom.runtime.lastError; }
      this.setBadge('');
    }.bind(this));
  },

  start: function() {
    console.log('Creating catcher alarm');
    chrome.alarms.create('catcher', { periodInMinutes : 1 });
  },

  stop: function() {
    console.log('Clearing catcher alarm');
    chrome.alarms.clear('catcher');
  }
}

chrome.runtime.onInstalled.addListener(function() {
  console.log('TossItToMe installed');
  chrome.storage.local.set({'catches': []});
});

chrome.runtime.onSuspend.addListener(function() {
  console.log('About to suspend TossItToMe');
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
