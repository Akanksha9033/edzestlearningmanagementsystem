// // server/routes/summarize.js
// import express from "express";

// // If using Node < 18, uncomment the next line:
// // import fetch from "node-fetch";

// const router = express.Router();
// const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// // Optional: quick self-test without calling OpenAI
// router.get("/_selftest", (req, res) => {
//   return res.json({
//     ok: true,
//     hasKey: Boolean(OPENAI_API_KEY),
//     node: process.version,
//   });
// });

// router.post("/", async (req, res) => {
//   try {
//     const { text, maxBullets = 6 } = req.body || {};
//     if (!text || text.trim().length < 10) {
//       return res.status(400).json({ error: "No text to summarize" });
//     }
//     if (!OPENAI_API_KEY) {
//       console.error("[summarize] Missing OPENAI_API_KEY");
//       return res.status(500).json({ error: "Missing OPENAI_API_KEY on server" });
//     }

//     const prompt = `
// Summarize the following content into ${maxBullets} concise bullet points.
// - Professional tone
// - Avoid redundancy
// - Each bullet <= 25 words
// Text:
// """${text}"""
// `.trim();

//     const resp = await fetch("https://api.openai.com/v1/chat/completions", {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${OPENAI_API_KEY}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         model: "gpt-4o-mini", // or another allowed model
//         messages: [{ role: "user", content: prompt }],
//         temperature: 0.2,
//       }),
//     });

//     if (!resp.ok) {
//       const errText = await resp.text().catch(() => "");
//       console.error("[summarize] OpenAI error:", resp.status, errText);
//       return res.status(resp.status).json({
//         error: "OpenAI error",
//         status: resp.status,
//         details: errText,
//       });
//     }

//     const data = await resp.json();
//     const content = data?.choices?.[0]?.message?.content || "";

//     const bullets = content
//       .split("\n")
//       .map((l) => l.replace(/^[-•*]\s*|\d+\.\s*/g, "").trim())
//       .filter(Boolean)
//       .slice(0, maxBullets);

//     return res.json({ bullets });
//   } catch (err) {
//     console.error("[summarize] Unhandled error:", err);
//     return res.status(500).json({ error: "Summarization failed", details: String(err?.message || err) });
//   }
// });

// export default router;

// server/routes/summarize.js  (CommonJS)
const express = require("express");
// Node 18+ has global fetch; if you run on Node 16 locally, uncomment next line:
// const fetch = (...args) => import("node-fetch").then(({default: f}) => f(...args));

const router = express.Router();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Quick self-test: GET /summarize/_selftest
router.get("/_selftest", (req, res) => {
  return res.json({
    ok: true,
    hasKey: Boolean(OPENAI_API_KEY),
    node: process.version,
  });
});

// POST /summarize
router.post("/", async (req, res) => {
  try {
    const { text, maxBullets = 6 } = req.body || {};
    if (!text || String(text).trim().length < 10) {
      return res.status(400).json({ error: "No text to summarize" });
    }
    if (!OPENAI_API_KEY) {
      console.error("[summarize] Missing OPENAI_API_KEY");
      return res.status(500).json({ error: "Missing OPENAI_API_KEY on server" });
    }

    const prompt = `
Summarize the following content into ${maxBullets} concise bullet points.
- Professional tone
- Avoid redundancy
- Each bullet <= 25 words
Text:
"""${String(text)}"""
`.trim();

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      console.error("[summarize] OpenAI error:", resp.status, errText);
      return res.status(resp.status).json({
        error: "OpenAI error",
        status: resp.status,
        details: errText,
      });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content || "";
    const bullets = content
      .split("\n")
      .map((l) => l.replace(/^[-•*]\s*|\d+\.\s*/g, "").trim())
      .filter(Boolean)
      .slice(0, maxBullets);

    return res.json({ bullets });
  } catch (err) {
    console.error("[summarize] Unhandled error:", err);
    return res.status(500).json({ error: "Summarization failed", details: String(err?.message || err) });
  }
});

module.exports = router;
