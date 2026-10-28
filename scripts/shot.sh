#!/bin/sh
# Screenshots the built prototype with headless Chrome.
#   scripts/shot.sh <out.png> "<query and hash>" [width] [height]
set -e
cd "$(dirname "$0")/.."
npx vite preview --port 4317 --strictPort >/dev/null 2>&1 &
PID=$!
for i in $(seq 1 30); do curl -s -o /dev/null http://localhost:4317/mosaic-prototype/ && break; sleep 0.3; done
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
  --window-size="${3:-1440},${4:-1024}" --virtual-time-budget=3000 --screenshot="$1" \
  "http://localhost:4317/mosaic-prototype/$2" >/dev/null 2>&1
kill $PID
