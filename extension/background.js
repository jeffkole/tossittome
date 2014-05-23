var tossItToMeBg = {
  requestNextPage: function() {
    TossItToMe.Network.get('/catch', this.load.bind(this));
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
        console.debug('No catches... carry on');
      }
      else {
        this.openPages(responses);
      }
    }
    else {
      console.error('Response was errorful', e);
    }
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
    console.info('Pages to open: %O', pages);
    pages.forEach(function(page) {
      chrome.tabs.create({
        'windowId': windowId,
        'url':      page.url,
        'active':   false
      });
    });
  },

  start: function() {
    chrome.alarms.get('catcher', function(alarm) {
      if (!alarm) {
        console.info('Creating catcher alarm');
        chrome.alarms.create('catcher', { periodInMinutes : 1 });
      }
    });
  },

  stop: function() {
    console.info('Clearing catcher alarm');
    chrome.alarms.clear('catcher');
  }
};

chrome.runtime.onStartup.addListener(function() {
  console.info('Chrome startup');
  tossItToMeBg.start();
});

chrome.runtime.onInstalled.addListener(function(details) {
  var message = 'Toss It To Me! ';
  if (details.reason === 'install') {
    message += 'installed';
  }
  else if (details.reason === 'update') {
    message += 'updated from version ' + details.previousVersion;
  }
  else {
    message += details.reason;
  }
  console.info(message);
  tossItToMeBg.start();
});

chrome.alarms.onAlarm.addListener(function(alarm) {
  console.info(alarm.name + ' alarm triggered');
  if (alarm.name === 'catcher') {
    tossItToMeBg.requestNextPage();
  }
});
chrome.cookies.onChanged.addListener(function(info) {
  if (!info.removed) {
    // If a cookie was created, then restart the poller
    tossItToMeBg.start();
  }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.openLink) {
    TossItToMe.Tabs.activateOrOpen(request.href);
  }
});
