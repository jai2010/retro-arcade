/* Local development server for the arcade.
 * Run: node server.mjs  (then open http://localhost:3000)
 * Serves static files plus the same /api/metrics and /api/admin endpoints that
 * the Vercel serverless functions provide. Metrics go to api/store.js. */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const metricsHandler = require("./api/metrics.js");
const adminHandler = require("./api/admin.js");
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
  ".webp": "image/webp", ".jpg": "image/jpeg", ".ico": "image/x-icon"
};

function runHandler(handler, req, res, body) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const query = Object.fromEntries(url.searchParams.entries());
  const fakeReq = Object.assign(Object.create(req), {
    method: req.method, url: req.url, headers: req.headers, query, body
  });
  const headers = {};
  const fakeRes = {
    statusCode: 200,
    setHeader: (k, v) => { headers[k] = v; },
    getHeader: k => headers[k],
    end: chunk => {
      res.statusCode = fakeRes.statusCode;
      for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
      res.end(chunk);
    }
  };
  return Promise.resolve(handler(fakeReq, fakeRes)).catch(err => {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ ok: false, error: String(err) }));
  });
}

http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (url.pathname.startsWith("/api/")) {
    let chunks = [];
    req.on("data", c => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      let body = raw;
      if ((req.headers["content-type"] || "").includes("application/json")) {
        try { body = JSON.parse(raw); } catch (_) {}
      }
      if (url.pathname === "/api/metrics") return runHandler(metricsHandler, req, res, body);
      if (url.pathname === "/api/admin") return runHandler(adminHandler, req, res, body);
      res.statusCode = 404; res.end("Not found");
    });
    return;
  }

  let rel = decodeURIComponent(url.pathname);
  if (rel === "/" || rel.endsWith("/")) rel += "index.html";
  const file = path.join(ROOT, path.normalize(rel).replace(/^(\.\.[/\\])+/, ""));
  if (!file.startsWith(ROOT)) { res.statusCode = 403; res.end("Forbidden"); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.statusCode = 404; res.end("Not found"); return; }
    res.setHeader("content-type", TYPES[path.extname(file)] || "application/octet-stream");
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`Retro Arcade + metrics API: http://localhost:${PORT}`);
  console.log(`Admin: http://localhost:${PORT}/admin.html  (password: ${process.env.ADMIN_PASSWORD || "arcade-admin"})`);
});
