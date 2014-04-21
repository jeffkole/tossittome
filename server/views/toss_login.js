(function() {
  var url = document.location.href;
  var title = document.title;
  if (title.substring(0, 13) == '(Tossing...) ') {
    title = title.substring(13);
  }
  {{#scriptId}}
  document.body.removeChild(document.getElementById('{{ scriptId }}'));
  {{/scriptId}}
  document.location = 'http://{{ host }}/login?url=' + encodeURIComponent(url) + '&title=' + encodeURIComponent(title);
})();
