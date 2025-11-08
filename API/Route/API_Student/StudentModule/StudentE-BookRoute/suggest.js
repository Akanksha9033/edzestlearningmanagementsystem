// // routes/suggest.js (ESM)
// import { Router } from "express";
// const router = Router();

// /**
//  * Proxies Google Suggest to avoid CORS/AdBlock issues.
//  * GET /suggest?q=...  ->  { suggestions: string[] }
//  */
// router.get("/", async (req, res) => {
//   try {
//     const q = String(req.query.q || "").trim();
//     if (!q) return res.json({ suggestions: [] });

//     // Choose an endpoint that returns JSON (no JSONP)
//     const url = new URL("https://suggestqueries.google.com/complete/search");
//     url.searchParams.set("client", "firefox"); // "chrome" also works
//     url.searchParams.set("q", q);

//     // Node 18+ has global fetch. If not, install 'node-fetch'.
//     const r = await fetch(url, {
//       headers: {
//         // A user-agent helps certain edge CDNs.
//         "User-Agent":
//           "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
//         "Accept": "application/json,text/javascript,*/*;q=0.1",
//         "Accept-Language": "en-US,en;q=0.7",
//       },
//     });

//     if (!r.ok) {
//       return res.status(502).json({ suggestions: [], error: `Upstream ${r.status}` });
//     }

//     // Google returns: [ "query", [ "s1","s2",... ] ]
//     const data = await r.json();
//     const suggestions = Array.isArray(data?.[1]) ? data[1] : [];
//     return res.json({ suggestions });
//   } catch (e) {
//     console.error("suggest proxy error:", e);
//     return res.status(500).json({ suggestions: [], error: "proxy_failed" });
//   }
// });

// export default router;

// routes/suggest.js  (CommonJS)
const express = require("express");
const router = express.Router();

// If you ever run on Node < 18 locally, uncomment this polyfill:
// const fetch = (...a) => import("node-fetch").then(({ default: f }) => f(...a));

/**
 * Proxies Google Suggest to avoid CORS/AdBlock issues.
 * GET /suggest?q=...  ->  { suggestions: string[] }
 */
router.get("/", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json({ suggestions: [] });

    const url = new URL("https://suggestqueries.google.com/complete/search");
    url.searchParams.set("client", "firefox"); // returns JSON array
    url.searchParams.set("q", q);

    const r = await fetch(url, {
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
    const data = await r.json();
    const suggestions = Array.isArray(data?.[1]) ? data[1] : [];
    return res.json({ suggestions });
  } catch (e) {
    console.error("suggest proxy error:", e);
    return res.status(500).json({ suggestions: [], error: "proxy_failed" });
  }
});

module.exports = router;
