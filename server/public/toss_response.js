(function() {
  var title = document.title;
  if (title.substring(0, 13) == '(Tossing...) ') {
    document.title = title.substring(13);
  }
})();
