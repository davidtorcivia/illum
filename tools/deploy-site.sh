#!/bin/sh
# Publish the site: rebuild site/ from the kit, mirror it (without the internal copy notes) into deploy/dist, and
# deploy it to Cloudflare as the 'illum' Worker's static assets at illum.davidtorcivia.com. Needs wrangler logged in.
set -e
cd "$(dirname "$0")/.."
[ "$1" = "--no-build" ] || sh tools/build-site.sh
mkdir -p deploy/dist
rsync -a --delete --exclude COPY.md site/ deploy/dist/
cd deploy && npx -y wrangler@4 deploy
