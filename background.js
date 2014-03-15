var tossa = {
  pageUrl: 'http://localhost:9999/?user=' + encodeURIComponent('jeffkole'),
  timeout: null,
  run: true,

  requestNextPage: function() {
    var req = new XMLHttpRequest();
    req.open("GET", this.pageUrl, true);
    req.onload = this.openNextPage.bind(this);
    req.send(null);
  },

  openNextPage: function(e) {
    var response = JSON.parse(e.target.responseText);
    console.log("Response site: " + response.site);
    window.open(response.site);
    var t = this;
    this.timeout = setTimeout(function() { t.loop(); }, 1000)
  },

  start: function() {
    this.run = true;
    this.loop();
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

tossa.start();
