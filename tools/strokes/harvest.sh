#!/bin/sh
# Fetch and segment every source in sources.txt: RAW=<download dir> WORK=<candidates dir> sh tools/strokes/harvest.sh [filter]
# Then curate (picks.txt) and build the library (build.py).
set -e
D=$(dirname "$0")
grep -v '^#' "$D/sources.txt" | grep -E "${1:-.}" | while read -r m id args; do
  [ -n "$m" ] || continue
  python3 -I "$D/fetch.py" get "$m" "$id" --to "$RAW"
  [ -f "$WORK/$m-$id/cands.json" ] && [ -z "$FORCE" ] && continue
  uv run -q --with pillow --with numpy --with scikit-image python -I "$D/segment.py" "$RAW/$m-$id" "$WORK" $args
done
