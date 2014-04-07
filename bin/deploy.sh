#!/bin/bash -e

# Called on the server to redeploy a version of the app
#
# usage: deploy.sh <app dir> <version dir>

if [[ $# -lt 2 ]]; then
  echo "usage: $0 <app dir> <version dir>"
  exit 1
fi

# APP_DIR looks like /var/www/tossittome
APP_DIR=$1; shift
# VERSION_DIR looks like /var/www/tossittome/.versions/<git-sha>
VERSION_DIR=$1; shift
SHA=$(basename ${VERSION_DIR})

cd ${VERSION_DIR}
./node_modules/.bin/gulp pack-extension
./node_modules/.bin/gulp scss

# Recreate current link
cd ${APP_DIR}
rm -f current && ln -s .versions/${SHA} current

# Restart app
${VERSION_DIR}/bin/stop
${VERSION_DIR}/bin/start
