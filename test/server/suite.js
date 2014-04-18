var util = require('test/util');

// Runs before all tests
before(function(done) {
  util.resetAutoIncrement('users', 'pages', 'catchers', done);
});
