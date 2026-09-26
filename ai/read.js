const dns = require("node:dns").promises;
const http = require("node:http");
const https = require("node:https");
const net = require("node:net");
const { clean, canonicalUrl } = require("./content");
const { isPublicAddress } = require("../sources/reachable");

function publicAddress(address) {
  // Only native global-unicast IPv6; reject mapped/transition encodings too.
  if (net.isIP(address) === 6 && !/^[23][0-9a-f]{3}:/i.test(address)) return false;
  if (/^(192\.0\.2\.|198\.51\.100\.|203\.0\.113\.|2001:db8:)/i.test(address)) return false;
  return isPublicAddress(address);
}

async function fetchPage(raw, { lookup = dns.lookup, timeout = 8000 } = {}) {
  let current = canonicalUrl(raw);
  if (!current) throw new Error("Invalid page URL");
  const deadline = Date.now() + timeout;
  for (let hop = 0; hop < 4; hop++) {
    const url = new URL(current);
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error("Page timeout");
    let timer;
    const addresses = await Promise.race([
      lookup(url.hostname, { all: true }),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("DNS timeout")), remaining); }),
    ]).finally(() => clearTimeout(timer));
    if (!addresses.length || addresses.some(a => !publicAddress(a.address))) throw new Error("Non-public page");
    const address = addresses[0];
    // Pin the checked address to the actual connection: no second DNS lookup,
    // including on redirects. TLS still verifies the original hostname.
    const result = await new Promise((resolve, reject) => {
      const req = (url.protocol === "https:" ? https : http).get(url, {
        agent: false, family: address.family,
        lookup: (_host, options, callback) => callback(null, options.all ? [address] : address.address, address.family),
        headers: { "user-agent": "PrysmContentReview/1.0", accept: "text/html,text/plain", "accept-encoding": "identity" },
      }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.destroy(); resolve({ redirect: new URL(res.headers.location, url).href }); return;
        }
        if (res.statusCode !== 200 || !/^text\/(html|plain)/i.test(res.headers["content-type"] || "") ||
            (res.headers["content-encoding"] && res.headers["content-encoding"] !== "identity")) {
          const error = new Error("Page not readable");
          if ([404, 410].includes(res.statusCode)) error.code = "gone";
          res.destroy(); reject(error); return;
        }
        const chunks = []; let size = 0;
        res.on("data", chunk => {
          size += chunk.length;
          if (size > 512 * 1024) { res.destroy(); reject(new Error("Page too large")); }
          else chunks.push(chunk);
        });
        res.on("end", () => resolve({ text: Buffer.concat(chunks).toString("utf8") }));
        res.on("error", reject);
      });
      const timer = setTimeout(() => req.destroy(new Error("Page timeout")), Math.max(1, deadline - Date.now()));
      req.on("close", () => clearTimeout(timer));
      req.on("error", reject);
    });
    if (!result.redirect) return result.text;
    current = canonicalUrl(result.redirect);
    if (!current) throw new Error("Invalid redirect");
  }
  throw new Error("Too many redirects");
}

function extractText(html) {
  let body = html.replace(/<(script|style|nav|header|footer|aside|form)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ");
  body = body.match(/<(?:main|article)\b[^>]*>([\s\S]*?)<\/(?:main|article)\s*>/i)?.[1] || body;
  return clean(body.replace(/<[^>]*>/g, " ").replace(/&#(x[0-9a-f]+|\d+);/gi, (_, n) => {
    const code = n[0].toLowerCase() === "x" ? parseInt(n.slice(1), 16) : Number(n);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : " ";
  }).replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, name) => ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " })[name]), 6000);
}

async function readCandidate(resource) {
  // A video page is not its transcript; a book listing is not the book.
  if (!["articles", "essays", "websites", "papers", "discussions", "qa"].includes(resource.category)) {
    return { id: resource.id, text: clean(`${resource.item.title}. ${resource.item.snippet}`, 6000), basis: "metadata" };
  }
  try {
    const text = extractText(await fetchPage(resource.url));
    if (text.length >= 250) return { id: resource.id, text, basis: "page" };
  } catch (error) {
    if (error.code === "gone") return { id: resource.id, text: "", basis: "metadata", unavailable: true };
    /* No penalty for a bot-blocked, paywalled, or temporarily unavailable page. */
  }
  return { id: resource.id, text: clean(`${resource.item.title}. ${resource.item.snippet}`, 6000), basis: "metadata" };
}

module.exports = { publicAddress, fetchPage, extractText, readCandidate };
