function renderLoginPopup(host, scriptId) {
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
    bg.style.backgroundColor = hiddenBg;
    dialog.style.bottom = hiddenBottom;
    setTimeout(function() {
      document.body.removeChild(dialog);
      document.body.removeChild(bg);
    }, slideDuration);
  }

  function showMessage(msg) {
    message.innerHTML = msg;
    message.style.display = 'inline';
  }

  function showFallbackMessage() {
    showMessage('An error has occurred during login. Please visit <a href="http://' +
        host + '/login?url=' + encodeURIComponent(document.location.href) + '">Toss It To Me</a> to login.');
  }

  function login(loginForm) {
    message.style.display = 'none';
    if (!loginForm.email.value.trim() || !loginForm.password.value.trim()) {
      showMessage('Please enter a valid email and password.');
      return;
    }
    try {
      var request = new XMLHttpRequest();
      request.open('POST', 'http://' + host + '/xhr/login', true);
      request.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
      request.withCredentials = true;
      var params =
        '&email=' + loginForm.email.value +
        '&password=' + loginForm.password.value;
      request.onreadystatechange = function() {
        try {
          if (request.readyState != 4) { return; }
          if (request.status != 200) { throw(request.statusText); }
          var response = JSON.parse(request.responseText);
          if (response.invalidUser) {
            showMessage('Invalid email or password. Try again.');
          }
          else {
            console.log('All good!', response);
            window.tossLoginSuccess++;
            initiateToss();
          }
        }
        catch (exception) {
          showFallbackMessage();
        }
      };
      request.send(params);
    }
    catch (exception) {
      showFallbackMessage();
    }
  }

  function initiateToss() {
    cleanup();
    var script = document.createElement('scr'+'ipt');
    var newScriptId = scriptId + '.1';
    script.setAttribute('id', newScriptId);
    script.setAttribute('src', document.location.protocol + '//' + host + '/toss?s=' + newScriptId);
    document.body.appendChild(script);
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
    'border': '1px solid #0096cc',
    'position': 'fixed',
    'bottom': hiddenBottom, /* start low to slide in */
    'left': 0,
    'width': '100%',
    'z-index': Math.pow(2, 32) - 2,
    'transition-property': 'bottom',
    'transition-duration': slideDuration + 'ms'
  };

  var contentsStyle = {
    'margin': '0 auto 0 auto',
    'max-width': '48rem'
  };

  var typeStyle = {
    'font-family': '\'Helvetica Neue\', Helvetica, sans-serif',
    'font-weight': 'normal',
    'font-size': calculateFontSize() + 'px'
  };

  var bgId = 'tossItToMe-bg-' + Math.random().toString().slice(2);
  var bg = document.createElement('div');
  bg.setAttribute('id', bgId);
  bg.setAttribute('style', flattenStyle(bgStyle));
  bg.addEventListener('click', function(e) {
    window.tossLoginSuccess = undefined;
    cleanup();
    e.preventDefault();
  }, false);

  var dialogId = 'tossItToMe-' + Math.random().toString().slice(2);
  var dialog = document.createElement('div');
  dialog.setAttribute('id', dialogId);
  dialog.setAttribute('style', flattenStyle(dialogStyle));

  var contents = document.createElement('div');
  contents.setAttribute('style', flattenStyle(contentsStyle));
  dialog.appendChild(contents);

  function addInput(form, displayName, type, name, placeholder) {
    var label = document.createElement('lable');
    label.setAttribute('for', name);
    label.setAttribute('style', flattenStyle({
      'display': 'block',
      'width': '100%',
      'line-height': '150%'
    }, typeStyle));
    label.appendChild(document.createTextNode(displayName + ':'));

    var input = document.createElement('input');
    input.setAttribute('type', type);
    input.setAttribute('name', name);
    input.setAttribute('placeholder', placeholder);
    input.setAttribute('style', flattenStyle(typeStyle, {
      'display': 'block',
      'width': '100%',
      'appearance': 'none',
      'border-style': 'solid',
      'border-width': '1px',
      '-moz-box-sizing': 'border-box',
      'box-sizing': 'border-box',
      'max-width': '100%',
      'line-height': '2rem',
      'padding': '0.5rem',
      'border-radius': '.25rem'
    }));

    form.appendChild(label);
    form.appendChild(input);
  }

  if (typeof window.tossLoginSuccess === 'undefined' || window.tossLoginSuccess === 0) {
    window.tossLoginSuccess = 0;
    var form = document.createElement('form');
    form.setAttribute('style', flattenStyle({
      'margin': '1rem'
    }));
    form.addEventListener('submit', function(e) {
      login(e.target);
      e.preventDefault();
    }, false);
    addInput(form, 'Email', 'email', 'email', 'foo@bar.com');
    addInput(form, 'Password', 'password', 'password', 'password');
    var row = document.createElement('div');
    row.setAttribute('style', flattenStyle({
      'padding-top': '0.5rem'
    }));
    form.appendChild(row);
    var submit = document.createElement('input');
    submit.setAttribute('type', 'submit');
    submit.setAttribute('name', 'login');
    submit.setAttribute('value', 'Login');
    submit.setAttribute('style', flattenStyle(typeStyle, {
      'line-height': '180%',
      'font-weight': 'bold',
      'text-decoration': 'none',
      'cursor': 'pointer',
      'border': 'none',
      'border-radius': '0.25rem',
      '-webkit-appearance': 'none',
      'appearance': 'none',
      'white-space': 'nowrap',
      'display': 'inline-block',
      'float': 'left',
      'height': 'auto',
      'min-height': '2rem',
      'padding': '0.5rem 1rem',
    }));
    row.appendChild(submit);
    var message = document.createElement('span');
    message.setAttribute('style', flattenStyle(typeStyle, {
      'display': 'none',
      'text-align': 'left',
      'line-height': '100%'
    }));
    row.appendChild(message);
    contents.appendChild(form);
  }
  else if (window.tossLoginSuccess > 0) {
    var manualLogin = document.createElement('div');
    manualLogin.setAttribute('style', flattenStyle(typeStyle, {
      'margin': '1rem',
      'line-height': '100%'
    }));
    manualLogin.innerHTML =
      'It appears you do not have cookies enabled for third party sites.<br/>Don&#8217;t worry about it.<br/>' +
      'Just head to <a href="http://' + host + '/login?url=' + encodeURIComponent(document.location.href) + '">' +
      'Toss It To Me</a> to login.';
    contents.appendChild(manualLogin);
    window.tossLoginSuccess = undefined;
  }

  setTimeout(function() {
    bg.style.backgroundColor = shownBg;
    dialog.style.bottom = shownBottom;
  }, 100);
  document.body.appendChild(bg);
  document.body.appendChild(dialog);
  // Calculate an appropriate bottom based on the real height, which can only be
  // done after the element has been added to the DOM
  hiddenBottom = '-' + dialog.offsetHeight + 'px';
  dialog.style.bottom = hiddenBottom;
}
