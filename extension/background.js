window.TossItToMe = window.TossItToMe || {};

window.TossItToMe.Background = (function() {
  var _running = false;

  var _load = function(e) {
    if (e.target.status == 401) {
      // Stop polling until the user logs in
      stop();
    }
    else if (e.target.status == 200) {
      var responses = JSON.parse(e.target.responseText);
      if (responses.noCatches) {
        // No catches, so nothing to do
        console.debug('No catches... carry on');
      }
      else {
        _openPages(responses);
      }
    }
    else {
      console.error('Response was errorful', e);
    }
  };

  var _openPages = function(pages) {
    _openPagesInWindow(pages, chrome.windows.WINDOW_ID_CURRENT);
    chrome.browserAction.getBadgeText({}, function(text) {
      var num = 0;
      if (text) {
        num = parseInt(text);
      }
      chrome.browserAction.setBadgeText({ text: (num + pages.length).toString() });
    });
  };

  var _openPagesInWindow = function(pages, windowId) {
    console.info('Pages to open: %O', pages);
    pages.forEach(function(page) {
      chrome.tabs.create({
        'windowId': windowId,
        'url':      page.url,
        'active':   false
      });
    });
  };

  var start = function() {
    chrome.alarms.get('catcher', function(alarm) {
      if (!alarm) {
        console.info('Creating catcher alarm');
        chrome.alarms.create('catcher', { periodInMinutes : 1 });
      }
      _running = true;
    });
  };

  var stop = function() {
    console.info('Clearing catcher alarm');
    chrome.alarms.clear('catcher', function(wasCleared) {
      if (wasCleared) {
        _running = false;
      }
    });
  };

  var isRunning = function() {
    return _running;
  };

  var requestNextPage = function() {
    TossItToMe.Network.get('/catch', _load);
  };

  return {
    start : start,
    stop : stop,
    isRunning : isRunning,
    requestNextPage : requestNextPage
  };
}());

chrome.runtime.onStartup.addListener(function() {
  console.info('Chrome startup');
  TossItToMe.Background.start();
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
  TossItToMe.Background.start();
});

chrome.alarms.onAlarm.addListener(function(alarm) {
  console.info(alarm.name + ' alarm triggered');
  if (alarm.name === 'catcher') {
    TossItToMe.Background.requestNextPage();
  }
});
chrome.cookies.onChanged.addListener(function(info) {
  if (!info.removed) {
    // If a cookie was created, then restart the poller
    TossItToMe.Background.start();
  }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.openLink) {
    TossItToMe.Tabs.activateOrOpen(request.href);
  }
});
