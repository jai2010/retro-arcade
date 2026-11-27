/* Offline-first usage metrics for the arcade.
 * Events are always written to localStorage first; when the page is online and
 * a sync server is configured, the queue is posted to /api/metrics and cleared.
 * No external libraries, fonts or network calls are needed to play.
 */
(() => {
  "use strict";

  const KEY = "arcade.metrics.v1";
  const SERVER_KEY = "arcade.metrics.server";
  const EMPTY = () => ({
    deviceId: "d" + Math.random().toString(36).slice(2, 10),
    events: [],
    views: {}, plays: {}, likes: {}, bookmarks: {}, bests: {},
    lastSync: 0
  });

  let state = EMPTY();
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved && typeof saved === "object") state = Object.assign(EMPTY(), saved);
  } catch (_) {}

  function save() {
    try {
      if (state.events.length > 2000) state.events = state.events.slice(-2000);
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function server() {
    try { return localStorage.getItem(SERVER_KEY) || ""; } catch (_) { return ""; }
  }

  function endpoint() {
    const base = server();
    if (base) return base.replace(/\/$/, "") + "/api/metrics";
    if (location.protocol === "http:" || location.protocol === "https:") return "/api/metrics";
    return "";
  }

  function queue(type, game, data) {
    state.events.push({ type, game, t: Date.now(), data: data || {} });
    save();
    flush();
  }

  function flush() {
    const url = endpoint();
    if (!url || !state.events.length || (typeof navigator !== "undefined" && navigator.onLine === false)) return Promise.resolve(false);
    const batch = state.events.slice();
    return fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deviceId: state.deviceId, events: batch })
    }).then(r => {
      if (!r.ok) throw new Error("sync failed");
      state.events = state.events.filter(e => !batch.includes(e));
      state.lastSync = Date.now();
      save();
      return true;
    }).catch(() => false);
  }

  function setFlag(kind, game, on) {
    state[kind][game] = !!on;
    queue(kind, game, { on: !!on });
    save();
  }

  function setBest(game, value) {
    const n = Number(value);
    if (!isFinite(n)) return;
    if (!(state.bests[game] >= n)) {
      state.bests[game] = n;
      queue("best", game, { value: n });
    }
  }

  function currentGame() {
    const parts = location.pathname.split("/").filter(Boolean);
    if (!parts.length) return "home";
    const last = parts[parts.length - 1];
    if (last === "index.html") return parts.length > 1 ? parts[parts.length - 2] : "home";
    return last.replace(/\..*$/, "") || "home";
  }

  const BEST_KEYS = {
    snake: "snake.best.v1", tetris: "tetris.best.v1", breakout: "breakout.best.v1",
    invaders: "invaders.best.v1", asteroids: "asteroids.best.v1", pong: "pong.best.v1",
    frogger: "frogger.best.v1", "2048": "2048.best.v1", simon: "simon.best.v1",
    pacman: "pacman.best.v1", skyhop: "skyhop.best.v1", whackamole: "whackamole.best.v1",
    memory: "memory.best.v1", fifteen: "fifteen.best.v1", minesweeper: "minesweeper.best.v1",
    connect4: "connect4.best.v1", sokoban: "sokoban.best.v1", lunarlander: "lunarlander.best.v1",
    missilecommand: "missilecommand.best.v1", roadrider: "roadrider.best.v1",
    rallyrun: "rallyrun.best.v1", highwayhero: "highwayhero.best.v1"
  };

  function readBest(game) {
    const key = BEST_KEYS[game];
    if (!key) return;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const value = JSON.parse(raw);
      if (typeof value === "number") setBest(game, value);
      else if (value && typeof value === "object") {
        const nums = Object.keys(value).map(k => Number(value[k])).filter(n => isFinite(n));
        if (nums.length) setBest(game, Math.max.apply(null, nums));
      }
    } catch (_) {}
  }

  let game = currentGame();
  if (document.querySelector(".game-card") || document.title === "Offline Arcade") game = "home";
  if (game !== "home") {
    state.views[game] = (state.views[game] || 0) + 1;
    queue("view", game);
    let played = false;
    const markPlay = () => {
      if (played) return;
      played = true;
      state.plays[game] = (state.plays[game] || 0) + 1;
      queue("play", game);
    };
    window.addEventListener("pointerdown", markPlay, { passive: true });
    window.addEventListener("keydown", markPlay);
    const poll = () => readBest(game);
    setTimeout(poll, 1200);
    setInterval(poll, 5000);
  }

  /* Header actions: Share everywhere, Like and Bookmark inside games.
   * Injected so the thumbnails stay clean and each game file stays self-contained. */
  const ACTION_CSS =
    "button.arcade-action{min-width:36px;min-height:36px;padding:4px 8px;" +
    "border:2px solid currentColor;border-radius:8px;background:transparent;color:inherit;" +
    "font:700 13px/1 var(--retro-font,monospace);text-transform:none;letter-spacing:0;" +
    "box-shadow:none;cursor:pointer}" +
    "button.arcade-action:hover{opacity:.75}" +
    "button.arcade-action[aria-pressed='true']{color:#e5724c}" +
    "@media(max-width:760px){button.arcade-action{min-width:26px!important;min-height:30px!important;" +
    "padding:2px 3px!important;font-size:10px!important}" +
    "button.arcade-action+button.arcade-action{margin-left:-2px}}";

  function action(label, aria, handler, toggle) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "arcade-action";
    b.textContent = label;
    b.setAttribute("aria-label", aria);
    if (toggle !== undefined) b.setAttribute("aria-pressed", String(!!toggle));
    b.addEventListener("click", e => { e.preventDefault(); handler(b); });
    return b;
  }

  function share(url, title) {
    if (navigator.share) return navigator.share({ title, url }).catch(() => {});
    if (navigator.clipboard) {
      return navigator.clipboard.writeText(url).then(() => {
        const b = document.querySelector("button.arcade-action.share");
        if (b) { b.textContent = "✓"; setTimeout(() => { b.textContent = "↗"; }, 1200); }
      }).catch(() => {});
    }
    location.href = "mailto:?subject=" + encodeURIComponent(title) + "&body=" + encodeURIComponent(url);
  }

  function installHeaderActions() {
    const style = document.createElement("style");
    style.textContent = ACTION_CSS;
    document.head.appendChild(style);
    const host = document.querySelector(".actions") || document.querySelector(".marquee") || document.querySelector("header");
    if (!host) return;
    const url = location.href.split("#")[0];
    const shareBtn = action("↗", "Share", () => share(url, document.title || "Retro Arcade"));
    shareBtn.classList.add("share");
    host.appendChild(shareBtn);
    if (game === "home") return;
    const likeBtn = action("♡", "Like " + game, () => {
      setFlag("likes", game, !state.likes[game]);
      likeBtn.setAttribute("aria-pressed", String(!!state.likes[game]));
    }, state.likes[game]);
    const bookmarkBtn = action("★", "Bookmark " + game, () => {
      setFlag("bookmarks", game, !state.bookmarks[game]);
      bookmarkBtn.setAttribute("aria-pressed", String(!!state.bookmarks[game]));
    }, state.bookmarks[game]);
    host.appendChild(likeBtn);
    host.appendChild(bookmarkBtn);
  }

  document.addEventListener("DOMContentLoaded", installHeaderActions);

  window.addEventListener("online", flush);
  setInterval(flush, 60000);
  flush();

  window.ArcadeMetrics = {
    state: () => JSON.parse(JSON.stringify(state)),
    game: () => game,
    flush,
    like: (g, on) => setFlag("likes", g, on),
    bookmark: (g, on) => setFlag("bookmarks", g, on),
    best: setBest,
    view: g => { state.views[g] = (state.views[g] || 0) + 1; queue("view", g); },
    play: g => { state.plays[g] = (state.plays[g] || 0) + 1; queue("play", g); },
    setServer: url => {
      try { localStorage.setItem(SERVER_KEY, url.replace(/\/$/, "")); } catch (_) {}
      flush();
    },
    getServer: server,
    pending: () => state.events.length
  };
})();
