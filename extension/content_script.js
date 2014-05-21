var links = document.querySelectorAll('#history a');
Array.prototype.forEach.call(links, function(link) {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    chrome.runtime.sendMessage({ openLink: true, href: link.href }, function(response) {
      console.log('response: ', response);
    });
  }, false);
});
