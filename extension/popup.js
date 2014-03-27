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
        li.innerText = caught.site;
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
