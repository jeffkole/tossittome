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
    chrome.storage.sync.get({
      destination: 'toss_window'
    }, function(options) {
      if (options.destination === 'toss_window') {
        chrome.storage.local.get({'catches': []}, function(data) {
          var catches = data.catches;
          var windowStats = {};
          var count = 0;
          if (catches.length > 0) {
            catches.forEach(function(page) {
              chrome.tabs.query({'url': page.tabUrl}, function(tabs) {
                tabs.forEach(function(tab) {
                  if (windowStats[tab.windowId] === undefined) {
                    windowStats[tab.windowId] = 1;
                  }
                  else {
                    windowStats[tab.windowId]++;
                  }
                });
                count++;
                // All done, now see which window won
                if (count === catches.length) {
                  var highCount = -1;
                  var winningWindowId = -3;
                  Object.keys(windowStats).forEach(function(windowId) {
                    if (windowStats[windowId] > highCount) {
                      winningWindowId = windowId;
                      highCount = windowStats[windowId];
                    }
                  });
                  winningWindowId = parseInt(winningWindowId);
                  if (winningWindowId === -3) {
                    tossItToMeBg.openPagesInNewWindow(pages);
                  }
                  else {
                    tossItToMeBg.openPagesInWindow(pages, winningWindowId);
                  }
                }
              });
            });
          }
          else {
            tossItToMeBg.openPagesInNewWindow(pages);
          }
        });
      }
      else {
        tossItToMeBg.openPagesInWindow(pages, chrome.windows.WINDOW_ID_CURRENT);
      }
    });
  },

  openPagesInNewWindow: function(pages) {
    chrome.windows.create({'focused': false}, function(win) {
      tossItToMeBg.openPagesInWindow(pages, win.id);
    });
  },

  openPagesInWindow: function(pages, windowId) {
    var count = 0;
    pages.forEach(function(page) {
      console.log("Page url: " + page.url);
      chrome.tabs.create({
        'windowId': windowId,
        'url':      page.url,
        'active':   false
      }, function(tab) {
        chrome.windows.update(tab.windowId, {'drawAttention': true});
        page.tabId = tab.id;
        page.windowId = tab.windowId;
        // The final URL of the page may be different from the one loaded during
        // the catch, so capture that
        page.tabUrl = tab.url;
        count++;
        if (count === pages.length) {
          tossItToMeBg.saveCatch(pages);
        }
      });
    });
  },

  saveCatch: function(responses) {
    chrome.storage.local.get('catches', function(catches) {
      if (chrome.runtime.lastError) { throw chrom.runtime.lastError; }
      if (catches.catches) {
        chrome.storage.local.set({'catches': catches.catches.concat(responses)});
        this.setBadge(catches.catches.length + responses.length);
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
    console.log('Starting');
    console.log('Creating catcher alarm');
    chrome.alarms.create('catcher', { periodInMinutes : 1 });
  },

  stop: function() {
    console.log('Clearing catcher alarm');
    chrome.alarms.clear('catcher');
  }
};

chrome.runtime.onInstalled.addListener(function() {
  console.log('Toss It To Me! installed');
  chrome.storage.local.set({'catches': []});
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


var tosser = {
  simulate: function() {
    tossItToMeBg.load({target:{status:200, responseText:'[{"url":"http://kolesky.com","title":"Kolesky!"}]'}});
  }
};
