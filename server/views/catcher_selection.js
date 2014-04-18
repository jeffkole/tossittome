(function() {
  function sendToss(catcherToken) {
    try {
      var request = new XMLHttpRequest();
      request.open('POST', 'http://{{ host }}/toss', true);
      request.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
      var params =
        '&t={{ tosserToken }}' +
        '&u=' + encodeURIComponent('{{ url }}') +
        '&i=' + encodeURIComponent('{{ title }}') +
        '&c=' + catcherToken;
      request.onreadystatechange = function() {
        try {
          if (request.readyState != 4) { return; }
          if (request.status != 200) { throw(request.statusText); }
          var title = document.title;
          if (title.substring(0, 13) == '(Tossing...) ') {
            document.title = title.substring(13);
          }
          document.body.removeChild(document.getElementById(dialogId));
        }
        catch (exception) {
          // TODO: run a backup request
        }
      };
      request.send(params);
    }
    catch (exception) {
      // TODO: run a backup request
    }
  }

  function calculateFontSize() {
    var big       = screen.width >= 1024,
        small     = screen.width <= 700,
        landscape = Math.abs(window.orientation) == 90;
    var maxFontSize = big ? 48 : 3600;
    var maxFontRatio = small ? (landscape ? 8 : 10) : (landscape ? 10 : 14);
    var pixelRatio = 2;
    var fontSize = Math.min(maxFontSize, Math.floor(window.innerHeight / maxFontRatio / pixelRatio));
    return fontSize;
  }

  function flattenStyle(style) {
    var flat = '';
    for (var k in style) {
      flat += (k + ':' + style[k] + '; ');
    }
    return flat;
  }

  var dialogStyle = {
    'color': '#111',
    'background-color': 'rgba(192,192,192,0.8)',
    'position': 'fixed',
    'top': 0,
    'left': 0,
    'display': 'table',
    'width': '100%',
    'height': '100%',
    'line-height': 'normal',
    'font-family': '\'Helvetica Neue\', Helvetica, sans-serif',
    'font-weight': 'bold',
    'text-align': 'center',
    'z-index': 9999,
    'font-size': calculateFontSize() + 'px'
  };

  var dialogId = 'tossItToMe-' + Math.random().toString().slice(2);
  var dialog = document.createElement('div');
  dialog.setAttribute('id', dialogId);
  dialog.setAttribute('style', flattenStyle(dialogStyle));

  var contents = document.createElement('div');
  contents.setAttribute('style', flattenStyle({
    'display': 'table-cell',
    'vertical-align': 'middle'
  }));
  dialog.appendChild(contents);

  {{#hasCatchers}}
    var headline = document.createElement('div');
    headline.innerText = 'To whom would you like to toss?';
    contents.appendChild(headline);

    var d, a;
    {{#catchers}}
      d = document.createElement('div');
      a = document.createElement('a');
      a.setAttribute('style', flattenStyle({
        'color': '#0096cc',
        'text-decoration': 'none'
      }));
      a.href = '#';
      a.addEventListener('click', function(e) {
        sendToss('{{ token }}');
        e.preventDefault();
        return false;
      }, false);
      a.innerText = '{{ email }}';
      d.appendChild(a);
      contents.appendChild(d);
    {{/catchers}}
  {{/hasCatchers}}

  {{^hasCatchers}}
    var headline = document.createElement('div');
    headline.innerText = 'Tossing...';
    contents.appendChild(headline);
    setTimeout(function() { sendToss('{{ tosserToken }}'); }, 500);
  {{/hasCatchers}}

  document.body.appendChild(dialog);
})();
