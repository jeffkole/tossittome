var http = require('http'),
    host = 'localhost',
    port = 9999;
http.createServer(function(request, response) {
  response.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  response.write(JSON.stringify({'url':'http://yahoo.com'}));
  response.end();
}).listen(port, host);
console.log('Server running at http://' + host + ':' + port);
