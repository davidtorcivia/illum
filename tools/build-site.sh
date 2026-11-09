#!/usr/bin/env bash
# Copy the library into the site so site/ is self-contained and can be deployed as a plain directory.
#
#   tools/build-site.sh
#
# What it copies (from playground/, which stays the source of truth; never edit the copies):
#   playground/kit/{illum,registry,all,marks,wayfinding,initials,frames,penwork,writer,medium,inkletter,cache,spray}.js  -> site/kit/
#   playground/kit/styles/*.js                                                               -> site/kit/styles/
#   playground/fonts/, fonts/kelmscott/, fonts/nouveau/, fonts/insular/, fonts/deco/ and fonts/choirbook/hand3/ (faces, letter outlines and licences) -> site/fonts/
# The styles find their faces at new URL('../../fonts/', import.meta.url), so kit/ and fonts/ must stay siblings.
#
# The site's own faces (site/faces/) are not copied: they are subsets made once with fontTools and kept in site/:
#   pyftsubset <font> --unicodes=<Latin-1 + punctuation> --layout-features=kern,liga,onum,pnum,lnum,tnum,smcp,c2sc,
#     case,frac,... --flavor=woff2   (Junicode first pinned to wdth=100 ENLA=0 with fontTools.varLib.instancer)
# Their licences are beside them (site/faces/*-OFL.txt).
set -euo pipefail
here=$(cd "$(dirname "$0")/.." && pwd)
src=$here/playground site=$here/site

# (the last bake, kit/bake.json, kit/bake-stamps.json and kit/bake/, stays: tools/bake.mjs redoes only what changed)
rm -rf "$site/kit/styles" "$site/fonts"; rm -f "$site"/kit/*.js "$site/kit/hash.json"
mkdir -p "$site/kit/styles" "$site/fonts"
for m in illum registry all marks wayfinding initials frames penwork writer medium inkletter cache spray; do cp "$src/kit/$m.js" "$site/kit/"; done
# (only the styles' committed modules, as committed: a style still being drawn in the tree is not shipped, nor work in
# progress on one already in, nor in the library's hash)
(cd "$here" && git ls-files -z 'playground/kit/styles/*.js' | while IFS= read -r -d '' f; do git show "HEAD:$f" > "$site/kit/styles/${f##*/}"; done)
cp "$src"/fonts/*.woff2 "$src"/fonts/*.txt "$site/fonts/"
mkdir -p "$site/fonts/kelmscott"; cp "$src"/fonts/kelmscott/*.woff2 "$src"/fonts/kelmscott/*.json "$src"/fonts/kelmscott/*.txt "$site/fonts/kelmscott/"
# (Nouveau's letters are outlines read at run time; its .ttf files are the sources they were exported from, not shipped)
mkdir -p "$site/fonts/nouveau"; cp "$src"/fonts/nouveau/*.json "$src"/fonts/nouveau/Bocklin-LICENSE.txt "$site/fonts/nouveau/"
# (Insular's face: Uncial Antiqua subset to its capitals and renamed, with its licence and a note; the full font and
# Trathnona beside it in the source are not loaded by the style, so not shipped)
mkdir -p "$site/fonts/insular"; cp "$src"/fonts/insular/illum-uncial-caps.woff2 "$src"/fonts/insular/illum-uncial-caps-README.txt "$src"/fonts/insular/UncialAntiqua-OFL.txt "$site/fonts/insular/"
# (Deco's four capitals, each subset to A-Z and renamed, with their notes and licences; loaded one by one as chosen. The full
# faces beside them in the source serve only the stage-1 direction page, so are not shipped)
mkdir -p "$site/fonts/deco"; cp "$src"/fonts/deco/illum-deco-*.woff2 "$src"/fonts/deco/illum-deco-*-README.txt "$src"/fonts/deco/{Limelight,Kalnia,Federo,Italiana}-OFL.txt "$site/fonts/deco/"
# (the choir book's Lombards, a letter to a file, fetched only for the initials a page has, and their licence; the earlier
# passes beside them in the source, chosen only by ?lombard= for study, are not shipped)
mkdir -p "$site/fonts/choirbook/hand3"; cp "$src"/fonts/choirbook/hand3/choir-lombard-*.woff2 "$src"/fonts/choirbook/hand3/OFL.txt "$site/fonts/choirbook/hand3/"
# the library's hash (kit/cache.js keys every remembered or baked ornament by it): every module and face as shipped, so a
# reader's browser need not read them all to know whether what it remembers is still current
echo "{\"hash\":\"$(cat "$site"/kit/*.js "$site"/kit/styles/*.js "$site"/fonts/*.woff2 "$site"/fonts/kelmscott/* "$site"/fonts/nouveau/* "$site"/fonts/insular/* "$site"/fonts/deco/* "$site"/fonts/choirbook/hand3/* | sha256sum | cut -c1-16)\"}" > "$site/kit/hash.json"

# the ornament baked (tools/bake.mjs), so a first visit is drawn from it rather than by the ink engine: every page at 1440
# and 390, light and dark, dpr 1 and 2, served from site/ itself on a spare port; into site/kit/bake.json and site/kit/bake/,
# which rubricate reads by default. NOBAKE=1 skips it (the pages then draw live, as before).
if [ -z "${NOBAKE:-}" ]; then
  port=${BAKE_PORT:-8790}
  python3 -m http.server "$port" --bind 127.0.0.1 --directory "$site" >/dev/null 2>&1 & srv=$!
  trap 'kill $srv 2>/dev/null' EXIT; sleep 1
  # what every page's ornament depends on besides its own HTML: the library and the site's shared css, js and faces
  export STAMP=$(cat "$site/kit/hash.json" "$site"/css/* "$site"/js/* "$site"/faces/* 2>/dev/null | sha256sum | cut -c1-16)
  # (not swatch.html, nav-options.html, type.html or diag.html: tools and drafts nobody is sent to)
  pages=$(cd "$site" && find . -name '*.html' ! -name swatch.html ! -name nav-options.html ! -name type.html ! -name diag.html | sed "s#^\./#http://127.0.0.1:$port/#" | sort)
  node "$here/tools/bake.mjs" "$site/kit/bake.json" $pages
  kill $srv; trap - EXIT
fi

echo "site: $(du -sh "$site" | cut -f1) in $(find "$site" -type f | wc -l) files"
