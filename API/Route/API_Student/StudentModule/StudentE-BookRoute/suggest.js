// Route/API_Student/StudentModule/StudentE-BookRoute/suggest.js (CommonJS)
const express = require("express");
const router = express.Router();

// Use global fetch if available (Node 18+). Otherwise lazy-load node-fetch.
let fetchFn = global.fetch;
if (!fetchFn) {
  fetchFn = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
}

/**
 * Proxies Google Suggest to avoid CORS/AdBlock issues.
 * GET /suggest?q=...  ->  { suggestions: string[] }
 */
router.get("/", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json({ suggestions: [] });

    // Build URL that returns JSON (not JSONP)
    const url = new URL("https://suggestqueries.google.com/complete/search");
    url.searchParams.set("client", "firefox"); // 'chrome' also works
    url.searchParams.set("q", q);

    const r = await fetchFn(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        Accept: "application/json,text/javascript,*/*;q=0.1",
        "Accept-Language": "en-US,en;q=0.7",
      },
    });

    if (!r.ok) {
      return res.status(502).json({ suggestions: [], error: `Upstream ${r.status}` });
    }

    // Google returns: [ "query", [ "s1","s2",... ] ]
    const data = await r.json().catch(() => null);
    const suggestions = Array.isArray(data?.[1]) ? data[1] : [];

    // Light caching to reduce hits
    res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600");

    return res.json({ suggestions });
  } catch (e) {
    console.error("[suggest] proxy error:", e);
    return res.status(500).json({ suggestions: [], error: "proxy_failed" });
  }
});

module.exports = router;
