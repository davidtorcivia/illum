#!/bin/sh
# Screenshot a page at desktop and phone widths, 2x DPR, for looking at before claiming anything.
# usage: tools/shot.sh <url> <out-prefix> [wait-ms]
# Writes <out-prefix>-1440.png and <out-prefix>-390.png. Uses Playwright's headless Chromium shell with the GPU
# --no-sandbox: AppArmor blocks user namespaces here; only ever point this at our own pages.
# (Intel Arc via ANGLE/Vulkan); set ILLUM_SHELL to another chrome-headless-shell binary if needed.
set -e
SHELL_BIN=${ILLUM_SHELL:-$(ls -d "$HOME"/.cache/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | tail -1)}
[ -x "$SHELL_BIN" ] || SHELL_BIN=$(ls -d "$HOME"/.cache/ms-playwright/chromium_headless_shell-*/*/chrome-headless-shell | tail -1)
WAIT=${3:-6000}
for size in 1440,1800 390,1500; do
  w=${size%,*}
  "$SHELL_BIN" --headless --no-sandbox --hide-scrollbars --force-device-scale-factor=2 --window-size=$size \
    --use-angle=vulkan --enable-gpu --ignore-gpu-blocklist --virtual-time-budget=$WAIT \
    --screenshot="$2-$w.png" "$1" >/dev/null 2>&1
  echo "$2-$w.png"
done
