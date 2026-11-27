/* Vercel serverless function: /api/metrics
 * POST accepts offline event batches; GET returns public aggregate counters. */
const store = require("./store.js");

module.exports = async function handler(req, res) {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "POST, GET, OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type");
  if (req.method === "OPTIONS") { res.statusCode = 204; return res.end(); }

  let data;
  try { data = await store.read(); } catch (e) {
    res.statusCode = 500; res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify({ ok: false, error: "store unavailable" }));
  }

  if (req.method === "POST") {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch (_) { body = {}; } }
    const events = body && Array.isArray(body.events) ? body.events : [];
    for (const ev of events) {
      if (!ev || typeof ev.game !== "string" || typeof ev.type !== "string") continue;
      const game = ev.game.slice(0, 60);
      const delta = ev.data && ev.data.on === false ? -1 : 1;
      if (ev.type === "view") data.views[game] = (data.views[game] || 0) + 1;
      else if (ev.type === "play") data.plays[game] = (data.plays[game] || 0) + 1;
      else if (ev.type === "like") data.likes[game] = Math.max(0, (data.likes[game] || 0) + delta);
      else if (ev.type === "bookmark") data.bookmarks[game] = Math.max(0, (data.bookmarks[game] || 0) + delta);
      else if (ev.type === "best") {
        const value = Number(ev.data && ev.data.value);
        if (isFinite(value) && value > (data.bests[game] || 0)) data.bests[game] = value;
      }
      if (data.events.length < 20000) data.events.push({ type: ev.type, game, t: ev.t || Date.now(), data: ev.data || {} });
    }
    try { await store.write(data); } catch (e) {
      res.statusCode = 500; res.setHeader("content-type", "application/json");
      return res.end(JSON.stringify({ ok: false, error: "write failed" }));
    }
    res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify({ ok: true, received: events.length }));
  }

  if (req.method === "GET") {
    res.setHeader("content-type", "application/json");
    res.setHeader("cache-control", "no-store");
    return res.end(JSON.stringify(store.aggregate(data)));
  }

  res.statusCode = 405;
  res.end("Method not allowed");
};
