/**
 * Free Zero-Cost Update Server for Solo Leveler
 * 
 * You can host this file for FREE on:
 * 1. GitHub Releases / GitHub Raw (Recommended, 100% free forever, unlimited traffic)
 * 2. Vercel (Free tier, deploy via `npx vercel`)
 * 3. Cloudflare Pages / Workers (Free tier)
 * 4. Local network / custom VPS
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;
const MANIFEST_PATH = path.join(__dirname, "update-manifest.json");

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === "/" || req.url === "/version.json" || req.url === "/update-manifest.json") {
    try {
      const data = fs.readFileSync(MANIFEST_PATH, "utf8");
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      });
      res.end(data);
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to read manifest file" }));
    }
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

server.listen(PORT, () => {
  console.log(`[SOLO LEVELER] Update Server running at http://localhost:${PORT}/version.json`);
});
