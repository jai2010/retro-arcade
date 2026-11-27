#!/bin/zsh
# Offline check for all arcade games: syntax, external URLs, TODOs, headless load.
set -u
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ROOT="/Users/jai/Dev/playground/ytVideo"
GAMES=("$ROOT/arcade/tetris/index.html" "$ROOT/arcade/snake/index.html" "$ROOT/arcade/breakout/index.html" "$ROOT/arcade/invaders/index.html" "$ROOT/arcade/asteroids/index.html" "$ROOT/arcade/pong/index.html" "$ROOT/arcade/frogger/index.html" "$ROOT/arcade/2048/index.html" "$ROOT/arcade/simon/index.html" "$ROOT/arcade/pacman/index.html" "$ROOT/arcade/skyhop/index.html" "$ROOT/arcade/whackamole/index.html" "$ROOT/arcade/memory/index.html" "$ROOT/arcade/fifteen/index.html" "$ROOT/arcade/minesweeper/index.html" "$ROOT/arcade/connect4/index.html" "$ROOT/arcade/sokoban/index.html" "$ROOT/arcade/lunarlander/index.html" "$ROOT/arcade/missilecommand/index.html")

for f in "${GAMES[@]}"; do
  echo "=== $f"
  if [[ ! -f "$f" ]]; then echo "MISSING"; continue; fi
  python3 - "$f" <<'PY'
import re, sys
s = open(sys.argv[1]).read()
m = re.search(r'<script>(.*?)</script>', s, re.S)
open('/tmp/arcade_check.js','w').write(m.group(1) if m else '')
clean = re.sub(r'url\(\s*["\']?data:[^)]*\)', '', s)
ext = re.findall(r'https?://[^\s"\']+', clean)
todo = re.findall(r'TODO|FIXME|implement later', s, re.I)
print('bytes:', len(s), 'external URLs:', len(ext), 'TODO-like:', len(todo))
PY
  node --check /tmp/arcade_check.js >/dev/null 2>&1 && echo "JS syntax: OK" || echo "JS syntax: FAIL"
  "$CHROME" --headless=new --disable-gpu --no-sandbox --virtual-time-budget=900 --dump-dom "file://$f" 2>/dev/null | grep -q '<canvas' && echo "headless render: OK" || echo "headless render: FAIL"
done
