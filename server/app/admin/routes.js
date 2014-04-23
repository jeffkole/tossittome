var appInfo       = require('../../../package.json'),
    extensionInfo = require('../../../extension/manifest.json'),
    serverInfo    = require('../../package.json');

function getVersion(request, response) {
  response.json(200, {
    version: appInfo.version,
    extension: {
      version: extensionInfo.version
    },
    server: {
      version: serverInfo.version
    }
  });
}

function setup(app) {
  app.get('/admin/version', getVersion);
}

module.exports = setup;
