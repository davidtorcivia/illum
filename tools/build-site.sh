#!/usr/bin/env bash
# Copy the library into the site so site/ is self-contained and can be deployed as a plain directory.
#
#   tools/build-site.sh
#
# What it copies (from playground/, which stays the source of truth; never edit the copies):
#   playground/kit/{illum,marks,wayfinding,initials,frames,penwork,writer,medium,inkletter}.js  -> site/kit/
#   playground/kit/styles/*.js                                                               -> site/kit/styles/
#   playground/fonts/ (the faces the styles load at run time, with their OFL texts)           -> site/fonts/
#   playground/03-penwork-initial.html (the forerunner, shown on engine.html)                 -> site/lab/
# The styles find their faces at new URL('../../fonts/', import.meta.url), so kit/ and fonts/ must stay siblings.
#
# The site's own faces (site/faces/) are not copied: they are subsets made once with fontTools and kept in site/:
#   pyftsubset <font> --unicodes=<Latin-1 + punctuation> --layout-features=kern,liga,onum,pnum,lnum,tnum,smcp,c2sc,
#     case,frac,... --flavor=woff2   (Junicode first pinned to wdth=100 ENLA=0 with fontTools.varLib.instancer)
# Their licences are beside them (site/faces/*-OFL.txt).
set -euo pipefail
here=$(cd "$(dirname "$0")/.." && pwd)
src=$here/playground site=$here/site

rm -rf "$site/kit" "$site/fonts" "$site/lab"
mkdir -p "$site/kit/styles" "$site/fonts" "$site/lab"
for m in illum marks wayfinding initials frames penwork writer medium inkletter; do cp "$src/kit/$m.js" "$site/kit/"; done
cp "$src"/kit/styles/*.js "$site/kit/styles/"
cp "$src"/fonts/*.woff2 "$src"/fonts/*.txt "$site/fonts/"

# the forerunner: 03 as it stands, its paths pointed at the copies, the playground's theme button left out (the frame
# takes ?theme= from engine.html), and its header comment (working notes and self-scores) not published
sed -e "s#from './kit/#from '../kit/#g" -e 's#url(fonts/#url(../fonts/#g' \
    -e '/kit\/theme-toggle.js/d' "$src/03-penwork-initial.html" | perl -0pe 's/<!--.*?-->\n//s' > "$site/lab/03-penwork-initial.html"

echo "site: $(du -sh "$site" | cut -f1) in $(find "$site" -type f | wc -l) files"
