// server/routes/summarize.js  (CommonJS)
const express = require("express");
// Node 18+ has global fetch; if you run on Node 16 locally, uncomment next line:
// const fetch = (...args) => import("node-fetch").then(({default: f}) => f(...args));

const router = express.Router();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // 🔑 API key from server environment

// -------------------------------------------------------------
// 🧪 Route 1: SELF TEST
// Quick check to verify the summarize API is correctly configured
// GET /summarize/_selftest
// -------------------------------------------------------------
router.get("/_selftest", (req, res) => {
  return res.json({
    ok: true,
    hasKey: Boolean(OPENAI_API_KEY), // tells if key exists
    node: process.version,           // Node version info
  });
});

// -------------------------------------------------------------
// 🧠 Route 2: MAIN SUMMARIZATION
// POST /summarize
// Body: { text: "...", maxBullets: 6 }
// -------------------------------------------------------------
router.post("/", async (req, res) => {
  try {
    const { text, maxBullets = 6 } = req.body || {};

    // ❌ Validate input text
    if (!text || String(text).trim().length < 10) {
      return res.status(400).json({ error: "No text to summarize" });
    }

    // ❌ Validate API Key
    if (!OPENAI_API_KEY) {
      console.error("[summarize] Missing OPENAI_API_KEY");
      return res.status(500).json({ error: "Missing OPENAI_API_KEY on server" });
    }

    // 🧾 Build summary instructions for OpenAI model
    const prompt = `
Summarize the following content into ${maxBullets} concise bullet points.
- Professional tone
- Avoid redundancy
- Each bullet <= 25 words
Text:
"""${String(text)}"""
`.trim();

    // 🌐 Send to OpenAI API — chat/completions
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,  // API key
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",                       // your chosen model
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,                           // low randomness = professional summary
      }),
    });

    // ❌ Upstream API failed
    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      console.error("[summarize] OpenAI error:", resp.status, errText);

      return res.status(resp.status).json({
        error: "OpenAI error",
        status: resp.status,
        details: errText,
      });
    }

    // 📥 Response from OpenAI
    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content || "";

    // 🧹 Extract bullet points (clean formatting)
    const bullets = content
      .split("\n")
      .map((l) =>
        l.replace(/^[-•*]\s*|\d+\.\s*/g, "").trim() // remove symbols like -,•,*,1.
      )
      .filter(Boolean)
      .slice(0, maxBullets);

    // 📤 Send back clean bullet output
    return res.json({ bullets });

  } catch (err) {
    console.error("[summarize] Unhandled error:", err);
    return res.status(500).json({
      error: "Summarization failed",
      details: String(err?.message || err),
    });
  }
});

module.exports = router;
