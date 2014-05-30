window.app = (function() {
  var init = function ( options ) {
    // Feature test before initializing
    if ('querySelector' in document && 'addEventListener' in window && Array.prototype.forEach) {
      var emailLinks = document.querySelectorAll('[data-email]');
      Array.prototype.forEach.call(emailLinks, function(emailLink) {
        var email = emailLink.getAttribute('data-email');
        var plainEmail = decodeURIComponent(email);
        emailLink.href = emailLink.href.replace('{email}', plainEmail);
        emailLink.textContent = emailLink.textContent.replace('{email}', plainEmail);
      });
    }
  };

  return {
    init: init
  };
})();
