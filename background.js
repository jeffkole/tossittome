var tossa = {
  pageUrl: 'http://localhost:9999/tossa?user=' + encodeURIComponent('jeffkole'),

  requestNextPage: function() {
    var req = new XMLHttpRequest();
    req.open("GET", this.pageUrl, true);
    req.onload = this.openNextPage.bind(this);
    req.send(null);
  },

  openNextPage: function(e) {
    var response = JSON.parse(e.target.responseText);
    console.log("Response URL: " + response.url);
    window.open(response.url);
  }
}

tossa.requestNextPage();
