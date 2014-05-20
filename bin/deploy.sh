#!/bin/bash -e

# Called on the server to redeploy a version of the app
#
# usage: deploy.sh <app dir> <version dir> <git repo dir>

if [[ $# -lt 2 ]]; then
  echo "usage: $0 <app dir> <version dir> [<git repo dir>]"
  exit 1
fi

# APP_DIR looks like /var/www/tossittome
APP_DIR=$1; shift
# VERSION_DIR looks like /var/www/tossittome/.versions/<git-sha>
VERSION_DIR=$1; shift
if [[ $# -gt 0 ]]; then
  GIT_REPO_DIR=$1; shift
fi
SHA=$(basename ${VERSION_DIR})

cd ${VERSION_DIR}
./node_modules/.bin/gulp scss-server

# Recreate current link
cd ${APP_DIR}
rm -f previous && ln -s $(readlink current) previous
rm -f current && ln -s .versions/${SHA} current

# Restart app
${VERSION_DIR}/bin/stop
${VERSION_DIR}/bin/start

# Delete all but the latest 5 versions
cd ${APP_DIR}
echo 'Going to remove old deployed versions'
ls -t .versions | awk 'NR > 5'
ls -t .versions | awk 'NR > 5' | xargs -I % rm -rf .versions/%

# Copy the post-receive hook into the git repo if it has changed
if [[ "${GIT_REPO_DIR}" != "" ]]; then
  if [[ $(diff -q ${VERSION_DIR}/bin/hooks/post-receive ${GIT_REPO_DIR}/hooks/post-receive) ]]; then
    echo 'Deploying the new post-receive hook'
    # This convoluted mv, cp, rm sequence is needed to ensure the running script
    # is not actually changed inflight.  mv preserves the old inode, which the
    # currently running script is using to read from.
    mv ${GIT_REPO_DIR}/hooks/post-receive ${GIT_REPO_DIR}/hooks/post-receive.bak
    cp ${VERSION_DIR}/bin/hooks/post-receive ${GIT_REPO_DIR}/hooks/post-receive
    rm ${GIT_REPO_DIR}/hooks/post-receive.bak
  fi
fi
