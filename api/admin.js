/* Vercel serverless function: /api/admin?action=...
 * Password gate uses ADMIN_PASSWORD (default arcade-admin for local dev). */
const store = require("./store.js");

function authed(req) {
  const cookie = String(req.headers.cookie || "");
  return /(?:^|;\s*)arcade_admin=1(?:;|$)/.test(cookie);
}

function csv(data) {
  const rows = [["game", "views", "plays", "likes", "bookmarks", "best"]];
  const games = Array.from(new Set(Object.keys(data.views).concat(Object.keys(data.plays))));
  for (const g of games.sort()) rows.push([g, data.views[g] || 0, data.plays[g] || 0, data.likes[g] || 0, data.bookmarks[g] || 0, data.bests[g] || ""]);
  return rows.map(r => r.join(",")).join("\n");
}

module.exports = async function handler(req, res) {
  const action = String((req.query && req.query.action) || "data");
  const url = new URL(req.url || "/", "http://localhost");
  const q = url.searchParams.get("action") || action;
  res.setHeader("cache-control", "no-store");
  res.setHeader("content-type", "application/json");

  if (q === "login" && req.method === "POST") {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch (_) { body = {}; } }
    const expected = process.env.ADMIN_PASSWORD || "arcade-admin";
    if (!body || body.password !== expected) {
      res.statusCode = 401;
      return res.end(JSON.stringify({ ok: false }));
    }
    res.setHeader("set-cookie", "arcade_admin=1; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800");
    return res.end(JSON.stringify({ ok: true }));
  }

  if (!authed(req)) { res.statusCode = 401; return res.end(JSON.stringify({ ok: false, error: "unauthorized" })); }

  const data = await store.read();
  if (q === "data") return res.end(JSON.stringify({ ok: true, data }));
  if (q === "export") {
    res.setHeader("content-type", "text/csv");
    res.setHeader("content-disposition", "attachment; filename=arcade-metrics.csv");
    return res.end(csv(data));
  }
  if (q === "reset" && req.method === "POST") {
    const fresh = store.EMPTY();
    await store.write(fresh);
    return res.end(JSON.stringify({ ok: true }));
  }
  res.statusCode = 400;
  return res.end(JSON.stringify({ ok: false, error: "unknown action" }));
};
