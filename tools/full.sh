#!/bin/sh
# One tall screenshot at 2x: tools/full.sh <url> <out.png> [width] [height]
B=$(ls -d "$HOME"/.cache/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell | tail -1)
"$B" --headless --no-sandbox --hide-scrollbars --force-device-scale-factor=2 --window-size=${3:-1440},${4:-4200} \
  --use-angle=vulkan --enable-gpu --ignore-gpu-blocklist --virtual-time-budget=8000 --screenshot="$2" "$1" >/dev/null 2>&1
echo "$2"
