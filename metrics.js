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

  const game = currentGame();
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
