// routes/suggest.js  (CommonJS)
const express = require("express");
const router = express.Router();

// If you ever run on Node < 18 locally, uncomment this polyfill:
// const fetch = (...a) => import("node-fetch").then(({ default: f }) => f(...a));

/**
 * =============================================================
 *  GET /suggest?q=keyword
 *
 *  PURPOSE:
 *  This endpoint acts as a **proxy** between your frontend
 *  and **Google Suggest API** so that:
 *    - No CORS error on browser
 *    - No API blocked by ad-blockers
 *    - Your backend hides Google request from frontend
 *
 *  Google returns suggestions in the format:
 *    [ "query", [ "suggest1", "suggest2", ... ] ]
 *
 *  We extract the array of suggestions and send:
 *      { suggestions: [...] }
 * =============================================================
 */
router.get("/", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json({ suggestions: [] });

    // Build the Google Suggest API URL
    const url = new URL("https://suggestqueries.google.com/complete/search");
    url.searchParams.set("client", "firefox"); // Firefox gives clean JSON
    url.searchParams.set("q", q);

    // Perform outbound fetch request
    const r = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        Accept: "application/json,text/javascript,*/*;q=0.1",
        "Accept-Language": "en-US,en;q=0.7",
      },
    });

    // If Google returns error
    if (!r.ok) {
      return res.status(502).json({
        suggestions: [],
        error: `Upstream ${r.status}`,
      });
    }

    // Google response: [ "query", [suggestions...] ]
    const data = await r.json();
    const suggestions = Array.isArray(data?.[1]) ? data[1] : [];

    return res.json({ suggestions });
  } catch (e) {
    console.error("suggest proxy error:", e);
    return res.status(500).json({
      suggestions: [],
      error: "proxy_failed",
    });
  }
});

module.exports = router;
