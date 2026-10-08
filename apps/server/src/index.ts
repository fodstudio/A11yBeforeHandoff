import express from "express";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeFigmaUrl, analyzeHtml, type AuditLevel, type AuditPlatform } from "./analyzer.js";

const app = express();
const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || "0.0.0.0";
const MAX_BYTES = 2_000_000;
app.use(express.json({ limit: "16kb" }));

function isPrivateAddress(address: string) {
  const normalized = address.toLowerCase();
  if (normalized === "::1" || normalized === "::" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) return true;
  const ipv4 = normalized.startsWith("::ffff:") ? normalized.slice(7) : normalized;
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(ipv4)) return false;
  const [a, b] = ipv4.split(".").map(Number);
  return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
}

async function validatePublicUrl(raw: string) {
  const url = new URL(raw);
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Only http and https URLs are supported.");
  if (url.username || url.password) throw new Error("URLs containing credentials are not supported.");
  if (url.hostname === "localhost" || url.hostname.endsWith(".local")) throw new Error("Local and private network addresses are not allowed.");
  const addresses = isIP(url.hostname) ? [{ address: url.hostname }] : await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) throw new Error("Local and private network addresses are not allowed.");
  return url;
}

async function fetchPage(raw: string) {
  let url = await validatePublicUrl(raw);
  const started = performance.now();
  for (let redirects = 0; redirects <= 4; redirects += 1) {
    const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(12_000), headers: { "user-agent": "A11yBeforeHandoff/0.1 accessibility-review" } });
    if (response.status >= 300 && response.status < 400 && response.headers.get("location")) {
      url = await validatePublicUrl(new URL(response.headers.get("location")!, url).toString());
      continue;
    }
    if (!response.ok) throw new Error(`The page responded with HTTP ${response.status}.`);
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) throw new Error("The URL did not return an HTML page.");
    const statedLength = Number(response.headers.get("content-length") || 0);
    if (statedLength > MAX_BYTES) throw new Error("The page is larger than the 2 MB analysis limit.");
    const reader = response.body?.getReader();
    if (!reader) throw new Error("The page body could not be read.");
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength; if (size > MAX_BYTES) { await reader.cancel(); throw new Error("The page is larger than the 2 MB analysis limit."); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return { html: new TextDecoder().decode(bytes), finalUrl: url.toString(), responseMs: Math.round(performance.now() - started) };
  }
  throw new Error("The page redirected too many times.");
}

app.get("/api/health", (_request, response) => response.json({ ok: true }));
app.post("/api/analyze", async (request, response) => {
  const raw = typeof request.body?.url === "string" ? request.body.url.trim() : "";
  const requestedPlatform = typeof request.body?.platform === "string" ? request.body.platform : "web";
  const platform: AuditPlatform = requestedPlatform === "mobile" || requestedPlatform === "ios" || requestedPlatform === "android" ? "mobile" : "web";
  const targetLevel: AuditLevel = request.body?.targetLevel === "AAA" ? "AAA" : "AA";
  if (!raw) return response.status(400).json({ error: "Enter a URL to analyze." });
  try {
    const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const candidate = new URL(normalized);
    if (candidate.hostname === "figma.com" || candidate.hostname.endsWith(".figma.com")) return response.json(analyzeFigmaUrl(normalized, platform, targetLevel));
    if (platform !== "web") return response.status(400).json({ error: "For Mobile reviews, enter a public Figma share URL." });
    const { html, finalUrl, responseMs } = await fetchPage(normalized);
    return response.json(analyzeHtml(html, normalized, finalUrl, responseMs, targetLevel));
  } catch (error) {
    const message = error instanceof Error ? error.message : "The page could not be analyzed.";
    return response.status(400).json({ error: message });
  }
});

const webDist = resolve(dirname(fileURLToPath(import.meta.url)), "../../web/dist");
app.use(express.static(webDist));
app.get("/{*path}", (_request, response) => response.sendFile(resolve(webDist, "index.html")));
app.listen(port, host, () => console.log(`Accessibility analysis API ready on http://${host}:${port}`));
