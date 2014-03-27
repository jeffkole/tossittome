(function() {
  var page = document.location.href;
  document.location = 'http://{{ host }}/login?page=' + encodeURIComponent(page);
})();
