var tossa = {
  pageUrl: 'http://localhost:9999/?user=' + encodeURIComponent('jeffkole'),
  timeout: null,
  run: true,

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
    window.open(response.site);
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
