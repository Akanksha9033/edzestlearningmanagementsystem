// summarize.js (CommonJS version)
const express = require("express");
const router = express.Router();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Use global fetch if Node 18+, otherwise fall back to node-fetch
let fetchFn = global.fetch;
if (!fetchFn) {
  fetchFn = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
}

router.get("/_selftest", (req, res) => {
  return res.json({
    ok: true,
    hasKey: Boolean(OPENAI_API_KEY),
    node: process.version,
  });
});

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
Summarize the following content into ${Math.max(1, Math.min(12, Number(maxBullets) || 6))} concise bullet points.
- Professional tone
- Avoid redundancy
- Each bullet <= 25 words
Text:
"""${text}"""
`.trim();

    const resp = await fetchFn("https://api.openai.com/v1/chat/completions", {
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

    // Normalize bullets
    const bullets = content
      .split("\n")
      .map((l) => l.replace(/^[-•*]\s*|\d+\.\s*/g, "").trim())
      .filter(Boolean)
      .slice(0, Math.max(1, Math.min(12, Number(maxBullets) || 6)));

    return res.json({ bullets });
  } catch (err) {
    console.error("[summarize] Unhandled error:", err);
    return res.status(500).json({ error: "Summarization failed", details: String(err?.message || err) });
  }
});

module.exports = router;
