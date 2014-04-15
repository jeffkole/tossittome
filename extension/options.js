var tossItToMeOptions = {
  initialize: function() {
    document.getElementById('options_form').addEventListener('change',
        function(e) {
          this.saveOptions();
          e.preventDefault();
        }.bind(this), true);
    this.restoreOptions();
  },

  saveOptions: function() {
    console.log('saving options');
    var form = document.getElementById('options_form');
    var destinations = document.getElementsByName('destination');
    for (var i = 0; i < destinations.length; i++) {
      if (destinations[i].checked) {
        this.saveDestination(destinations[i].value);
      }
    }
  },

  saveDestination: function(destination) {
    chrome.storage.sync.set({ destination: destination }, function() {
      var status = document.getElementById('status');
      status.textContent = 'Options saved.';
      setTimeout(function() {
        status.textContent = '';
      }, 750);
    });
  },

  restoreOptions: function() {
    console.log('restoring options');
    chrome.storage.sync.get({ destination: 'toss_window' }, function(options) {
      var destinations = document.getElementsByName('destination');
      for (var i = 0; i < destinations.length; i++) {
        if (options.destination === destinations[i].value) {
          destinations[i].checked = true;
        }
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', function() {
  tossItToMeOptions.initialize();
});
