function renderCatcherSelection(host, catcherData, scriptId, forceIframe) {
  var slideDuration = 500,
      shownBottom   = '0px',
      hiddenBottom  = '-1000px',
      shownBg       = 'rgba(0,0,0,0.6)',
      hiddenBg      = 'rgba(0,0,0,0)';

  function cleanup() {
    var title = document.title;
    if (title.substring(0, 13) == '(Tossing...) ') {
      document.title = title.substring(13);
    }
    if (scriptId) {
      document.body.removeChild(document.getElementById(scriptId));
    }
    var bg = document.getElementById(bgId);
    var dialog = document.getElementById(dialogId);
    bg.style.backgroundColor = hiddenBg;
    dialog.style.bottom = hiddenBottom;
    setTimeout(function() {
      document.body.removeChild(dialog);
      document.body.removeChild(bg);
    }, slideDuration);

    // Disinfect the window
    window.iframeLoadCount = undefined;
    window.checkFrameLoad = undefined;
  }

  function sendToss(catcherToken) {
    if (forceIframe) {
      sendTossViaIframe(catcherToken, document.location.href, document.title);
      return;
    }
    try {
      var start = (new Date()).getTime();
      // Wait at least this many milliseconds
      var lagTime = 800;
      var request = new XMLHttpRequest();
      request.open('POST', 'http://' + host + '/toss', true);
      request.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
      request.withCredentials = true;
      var params =
        '&u=' + encodeURIComponent(document.location.href) +
        '&i=' + encodeURIComponent(document.title) +
        '&c=' + catcherToken;
      request.onreadystatechange = function() {
        try {
          if (request.readyState != 4) { return; }
          if (request.status != 200) { throw(request.statusText); }
          var duration = (new Date()).getTime() - start;
          if (duration < lagTime) {
            setTimeout(cleanup, (lagTime - duration));
          }
          else {
            cleanup();
          }
        }
        catch (exception) {
          sendTossViaIframe(catcherToken, document.location.href, document.title);
        }
      };
      request.send(params);
    }
    catch (exception) {
      sendTossViaIframe(catcherToken, document.location.href, document.title);
    }
  }

  var iframeId = 'tossItToMe-if-' + Math.random().toString().slice(2);

  // Infect the window so that the variable is visible to the iframe
  window.iframeLoadCount = 0;
  window.checkFrameLoad  = function() {
    // Load count will be 2 after the form submission finished loading
    if (iframeLoadCount === 2) {
      document.body.removeChild(document.getElementById(iframeId));
      cleanup();
    }
  };

  function sendTossViaIframe(catcherToken, href, title) {
    var iframe = document.createElement('iframe');
    iframe.setAttribute('id', iframeId);
    iframe.setAttribute('style', 'border: 0; width: 1px; height: 1px; position: absolute; left: 0; top: 0;');
    iframe.setAttribute('onload', 'iframeLoadCount++; checkFrameLoad();');
    // The iframe document is not defined until after it is added to the
    // parent document.
    document.body.appendChild(iframe);
    window.frames[iframeId].document.write(
        '<html><body>' +
        '<form action="http://' + host + '/toss" method="post">' +
        '<input type="hidden" name="u" value="' + href + '"/>' +
        '<input type="hidden" name="i" value="' + title + '"/>' +
        '<input type="hidden" name="c" value="' + catcherToken + '"/>' +
        '</form>' +
        '<scr' + 'ipt>document.forms[0].submit();</scr' + 'ipt>' +
        '</body></html>'
        );
  }

  function landscape() {
    return (Math.abs(window.orientation) == 90);
  }

  function calculateFontSize() {
    var big         = screen.width >= 1024,
        small       = screen.width <= 700,
        maxFontSize = big ? 48 : 3600,
        fontRatio   = small ? (landscape() ? 15 : 20) : 28;
    // innerHeight change as the zoom level changes
    var fontSize = Math.min(maxFontSize, Math.floor(window.innerHeight / fontRatio));
    return fontSize;
  }

  function calculateCatcherHeight() {
    var multiplier = landscape() ? 8 : 12;
    return (calculateFontSize() * multiplier);
  }

  function flattenStyle(/* style, style, style,... */) {
    var flat = '';
    for (var i = 0; i < arguments.length; i++) {
      var style = arguments[i];
      for (var k in style) {
        flat += (k + ':' + style[k] + '; ');
      }
    }
    return flat;
  }

  var bgStyle = {
    'background-color': hiddenBg,
    'position': 'fixed',
    'top': 0,
    'left': 0,
    'width': '100%',
    'height': '100%',
    'z-index': Math.pow(2, 32) - 3,
    'transition-property': 'background',
    'transition-duration': slideDuration + 'ms'
  };

  var dialogStyle = {
    'color': '#111',
    'background-color': '#fff',
    'position': 'fixed',
    'bottom': hiddenBottom, /* start low to slide in */
    'left': 0,
    'width': '100%',
    'z-index': Math.pow(2, 32) - 2,
    'transition-property': 'bottom',
    'transition-duration': slideDuration + 'ms'
  };

  var typeStyle = {
    'line-height': '220%',
    'font-family': '\'Helvetica Neue\', Helvetica, sans-serif',
    'font-weight': 'normal',
    'text-align': 'center',
    'font-size': calculateFontSize() + 'px'
  };

  var bgId = 'tossItToMe-bg-' + Math.random().toString().slice(2);
  var bg = document.createElement('div');
  bg.setAttribute('id', bgId);
  bg.setAttribute('style', flattenStyle(bgStyle));
  bg.addEventListener('click', function(e) {
    cleanup();
    e.preventDefault();
    return false;
  }, false);
  // Capture the touchmove event so that scrolling does not occur underneath
  bg.addEventListener('touchmove', function(e) {
    e.preventDefault();
  }, true);

  var dialogId = 'tossItToMe-' + Math.random().toString().slice(2);
  var dialog = document.createElement('div');
  dialog.setAttribute('id', dialogId);
  dialog.setAttribute('style', flattenStyle(dialogStyle));

  var contents = document.createElement('div');
  contents.setAttribute('style', flattenStyle({
    'border': '1px solid #0096cc'
  }));
  dialog.appendChild(contents);

  var headline = document.createElement('div');
  var transitionInMs;
  if (catcherData.length > 1) {
    var fontSize = calculateFontSize();
    headline.setAttribute('style', flattenStyle({
      'border-bottom': '1px solid #ccc'
    }, typeStyle));
    headline.addEventListener('touchmove', function(e) {
      e.preventDefault();
    }, false);
    headline.innerText = 'To whom would you like to toss?';
    contents.appendChild(headline);

    var catchers = document.createElement('div');
    catchers.setAttribute('style', flattenStyle({
      'overflow-y': 'scroll',
      'max-height': calculateCatcherHeight() + 'px'
    }));
    // Prevent scrolling from occuring underneath the scrollable catchers container
    var lastY = -1;
    catchers.addEventListener('touchstart', function(e) {
      lastY = e.touches[0].clientY;
    }, false);
    catchers.addEventListener('touchmove', function(e) {
      // When the catchers div is scrolled fully up or fully down, prevent
      // default scroll behavior
      var scrollTop = catchers.scrollTop,
          offsetHeight = catchers.offsetHeight,
          scrollHeight = catchers.scrollHeight;
      var currentY = e.touches[0].clientY;
      if (currentY > lastY) {
        // Touch moved down
        if (scrollTop === 0) {
          e.preventDefault();
        }
      }
      else {
        // Touch moved up
        if (scrollTop + offsetHeight >= scrollHeight) {
          e.preventDefault();
        }
      }
      // TODO: attempt to prevent pinch zoom when in the middle of the list?
      lastY = currentY;
    }, false);
    contents.appendChild(catchers);

    /* SVG from jxnblk: https://github.com/jxnblk/loading/blob/master/loading-spin.svg */
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" ' +
      'width="' + fontSize + '" height="' + fontSize + '" fill="white" ' +
      'style="vertical-align: middle; margin-left: -' + fontSize + 'px">' +
      '<path opacity=".25" d="M16 0 A16 16 0 0 0 16 32 A16 16 0 0 0 16 0 M16 4 A12 12 0 0 1 16 28 A12 12 0 0 1 16 4"/>' +
      '<path d="M16 0 A16 16 0 0 1 32 16 L28 16 A12 12 0 0 0 16 4z">' +
      '<animateTransform attributeName="transform" type="rotate" ' +
      'from="0 16 16" to="360 16 16" dur="0.8s" repeatCount="indefinite" />' +
      '</path></svg>';
    var linkStyle = {
      'color': '#0096cc',
      'text-decoration': 'none',
      'display': 'block',
      'border-bottom': '1px solid #ccc'
    };

    var addCatcher = function(catcher) {
      var a = document.createElement('a');
      a.setAttribute('style', flattenStyle(linkStyle, typeStyle));
      a.href = '#';
      a.addEventListener('click', function(e) {
        // Set the loading svg fill to a visible color
        e.target.children[0].style.fill = '#0096cc';
        sendToss(catcher.token);
        e.preventDefault();
        return false;
      }, false);
      a.innerHTML = svg + ' ' + catcher.email;
      catchers.appendChild(a);
    };

    for (var i = 0; i < catcherData.length; i++) {
      addCatcher(catcherData[i]);
    }

    var cancel = document.createElement('a');
    cancel.setAttribute('style', flattenStyle({
      'color': '#0096cc',
      'text-decoration': 'none',
      'display': 'block',
      'border-top': '1px solid #0096cc'
    }, typeStyle));
    cancel.href = '#';
    cancel.addEventListener('click', function(e) {
      cleanup();
      e.preventDefault();
      return false;
    }, false);
    cancel.addEventListener('touchmove', function(e) {
      e.preventDefault();
    }, false);
    cancel.innerText = 'Cancel';
    contents.appendChild(cancel);
    // Initiate the transition a little after the dialog has been loaded
    transitionInMs = 100;
  }
  // Only one catcher (ie, the tosser)
  else {
    headline.setAttribute('style', flattenStyle(typeStyle));
    headline.innerText = 'Tossing...';
    contents.appendChild(headline);
    transitionInMs = 0;
    setTimeout(function() { sendToss(catcherData[0].token); }, (slideDuration + 500));
  }

  setTimeout(function() {
    bg.style.backgroundColor = shownBg;
    dialog.style.bottom = shownBottom;
  }, transitionInMs);
  document.body.appendChild(bg);
  document.body.appendChild(dialog);
  // Calculate an appropriate bottom based on the real height, which can only be
  // done after the element has been added to the DOM
  hiddenBottom = '-' + dialog.offsetHeight + 'px';
  dialog.style.bottom = hiddenBottom;
}
