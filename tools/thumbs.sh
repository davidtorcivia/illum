#!/bin/sh
# Refresh the index thumbnails: tools/thumbs.sh 01-ivy-border [00-pen-and-paint ...] (served at http://localhost:8000)
B=$(ls -d "$HOME"/.cache/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell | tail -1)
for n in "$@"; do
  "$B" --headless --no-sandbox --hide-scrollbars --force-device-scale-factor=2 --window-size=1200,800 --use-angle=vulkan --enable-gpu \
    --virtual-time-budget=15000 --screenshot=${TMPDIR:-/tmp}/illum-thumb.png "http://localhost:8000/playground/$n.html" >/dev/null 2>&1
  uv run --with pillow python -c "from PIL import Image; Image.open('${TMPDIR:-/tmp}/illum-thumb.png').convert('RGB').resize((960,640), Image.LANCZOS).save('playground/thumbs/$n.webp', quality=86)"
  echo "playground/thumbs/$n.webp"
done
