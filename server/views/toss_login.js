(function() {
  var url = document.location.href;
  document.location = 'http://{{ host }}/login?url=' + encodeURIComponent(url);
})();
