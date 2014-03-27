var tossittome = {
  numNewTabs: 0,

  initialize: function() {
    document.getElementById('clear_link').addEventListener('click', function(e) {
      this.clearLinks();
      e.stopPropogation();
    }.bind(tossittome), false);

    chrome.runtime.sendMessage({}, function(catches) {
      console.log('received response');
      console.log(catches);
      document.getElementById('num_caught').innerText = catches.length.toString();
      var ul = document.getElementById('site_list');
      catches.forEach(function(caught) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.innerText = caught.site;
        a.href = '#';
        a.addEventListener('click', function(e) {
          chrome.tabs.update(caught.tabId, {'active': true});
          chrome.windows.update(caught.windowId, {'focused': true});
          e.stopPropogation();
        }, false);
        li.appendChild(a);
        ul.appendChild(li);
      });
    });
  },

  clearLinks: function() {
    document.getElementById('site_list').innerHTML = '';
    document.getElementById('num_caught').innerText = '0';
    chrome.browserAction.setBadgeText({'text': ''});
  }
};

document.addEventListener('DOMContentLoaded', function() {
  tossittome.initialize();
});
