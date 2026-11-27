/* Metrics storage: a JSON file for local/dev use, or Vercel Blob when a token
 * is configured. The same module is used by the serverless functions and by
 * server.mjs, so local and deployed statistics have the same shape. */
const fs = require("fs");
const path = require("path");

const LOCAL_FILE = path.join(__dirname, "..", ".data", "metrics.json");
const BLOB_NAME = "metrics.json";

const EMPTY = () => ({
  events: [],
  views: {}, plays: {}, likes: {}, bookmarks: {}, bests: {},
  updated: 0
});

async function blobToken() { return process.env.BLOB_READ_WRITE_TOKEN || ""; }

async function read() {
  const token = await blobToken();
  if (token) {
    try {
      const { get } = await import("@vercel/blob");
      const result = await get(BLOB_NAME, { token });
      const data = await result.json();
      return Object.assign(EMPTY(), data);
    } catch (_) { /* fall through to empty */ }
    return EMPTY();
  }
  try {
    const data = JSON.parse(fs.readFileSync(LOCAL_FILE, "utf8"));
    return Object.assign(EMPTY(), data);
  } catch (_) { return EMPTY(); }
}

async function write(data) {
  data.updated = Date.now();
  const token = await blobToken();
  if (token) {
    const { put } = await import("@vercel/blob");
    await put(BLOB_NAME, JSON.stringify(data), {
      access: "public", token, addRandomSuffix: false, contentType: "application/json"
    });
    return;
  }
  fs.mkdirSync(path.dirname(LOCAL_FILE), { recursive: true });
  fs.writeFileSync(LOCAL_FILE, JSON.stringify(data));
}

function aggregate(data) {
  return {
    views: data.views || {}, plays: data.plays || {},
    likes: data.likes || {}, bookmarks: data.bookmarks || {},
    bests: data.bests || {}, updated: data.updated || 0
  };
}

module.exports = { read, write, aggregate, EMPTY };
