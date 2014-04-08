(function() {
  var big       = screen.width >= 1024,
      small     = screen.width <= 700,
      landscape = Math.abs(window.orientation) == 90;
  var maxFontSize = big ? 48 : 3600;
  var maxFontRatio = small ? (landscape ? 6 : 8) : (landscape ? 10 : 14);
  var fontSize = Math.min(maxFontSize, Math.floor(window.innerHeight / maxFontRatio)) + 'px';

  var div = document.createElement('div');
  div.setAttribute('id', 'tossittome');
  div.setAttribute('style', 'color: #111; background-color: rgba(192,192,192,0.8); position: fixed; top: 0; left: 0; display: table; width: 100%; height: 100%; font-family: Helvetica, sans-serif; font-weight: bold; text-align: center; z-index: 9999; font-size: ' + fontSize);
  var span = document.createElement('span');
  span.setAttribute('style', 'display: table-cell; vertical-align: middle;');
  span.innerHTML = 'Tossing<br/>&nbsp;';
  div.appendChild(span);
  document.body.appendChild(div);
  var i;
  var m = 350;
  for (i = 1; i < 4; i++) {
    setTimeout(function() { span.innerHTML += '.'; }, m * i);
  }
  setTimeout(function() {
    var title = document.title;
    if (title.substring(0, 13) == '(Tossing...) ') {
      document.title = title.substring(13);
    }
    document.body.removeChild(div);
  }, m * i);
})();
