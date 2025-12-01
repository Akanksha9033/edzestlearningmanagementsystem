// routes/notes.js
import express from "express";
import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// ---- S3 Setup (reuses global AWS.config from app.js) ----
// Using AWS SDK v2 S3 Client (works fine because project already uses v2 in some places)
const s3 = new AWS.S3({ apiVersion: "2006-03-01" });

// Bucket name where notes are stored
const BUCKET = process.env.S3_BUCKET;               // required
const PREFIX = process.env.NOTES_PREFIX || "notes"; // base folder name in bucket

// ---- Helpers to build S3 keys (paths) ----

// Key for latest version → notes/{userId}/{ebookId}/latest.json
function keyForLatest(userId, ebookId) {
  return `${PREFIX}/${encodeURIComponent(userId)}/${encodeURIComponent(ebookId)}/latest.json`;
}

// Key for versioned backup → notes/{userId}/{ebookId}/{timestamp_uuid}.json
function keyForVersion(userId, ebookId, ts, rand) {
  return `${PREFIX}/${encodeURIComponent(userId)}/${encodeURIComponent(ebookId)}/${ts}_${rand}.json`;
}

// Uniform error response helper
function bad(res, msg, code = 400) {
  return res.status(code).json({ ok: false, message: msg });
}

/**
 * =================================================================
 * POST /notes/save
 * ---------------------------------------------------------------
 * Saves user Notes + Highlights of an e-book chapter/page.
 *
 * It stores TWO FILES in S3:
 *   1️⃣ versioned JSON → (timestamp_uuid.json)
 *   2️⃣ latest.json → always overwritten → pointer to most recent version
 * =================================================================
 */
router.post("/save", async (req, res) => {
  try {
    if (!BUCKET) return bad(res, "S3_BUCKET not configured on server", 500);

    // Extract fields
    const { userId, ebookId, html = "", text = "", meta = {} } = req.body || {};
    if (!userId || !ebookId) return bad(res, "userId and ebookId are required");

    const now = new Date().toISOString();

    // Full note object
    const item = {
      id: uuidv4(),     // unique ID for this version
      userId,
      ebookId,
      html,             // full HTML (formatted notes)
      text,             // plain text version
      meta,             // extra metadata (selected text, position, etc.)
      updatedAt: now,
    };

    // Build S3 keys
    const versionKey = keyForVersion(userId, ebookId, now, item.id);
    const latestKey = keyForLatest(userId, ebookId);

    // Upload versioned JSON (backup history)
    await s3
      .putObject({
        Bucket: BUCKET,
        Key: versionKey,
        Body: Buffer.from(JSON.stringify(item, null, 2)),
        ContentType: "application/json; charset=utf-8",
        ACL: "private",
      })
      .promise();

    // Upload latest.json → overwrites old pointer
    await s3
      .putObject({
        Bucket: BUCKET,
        Key: latestKey,
        Body: Buffer.from(JSON.stringify({ ...item, latest: true }, null, 2)),
        ContentType: "application/json; charset=utf-8",
        ACL: "private",
      })
      .promise();

    return res.json({ ok: true, key: versionKey, latestKey, updatedAt: now });
  } catch (err) {
    console.error("[/notes/save] ERR", err);
    return res.status(500).json({ ok: false, message: "Server error saving notes" });
  }
});

/**
 * =================================================================
 * GET /notes/get?userId=...&ebookId=...
 * ---------------------------------------------------------------
 * Loads ONLY the latest notes saved by the user.
 *
 * Reads:
 *   notes/{userId}/{ebookId}/latest.json
 * =================================================================
 */
router.get("/get", async (req, res) => {
  try {
    if (!BUCKET) return bad(res, "S3_BUCKET not configured on server", 500);

    const { userId, ebookId } = req.query || {};
    if (!userId || !ebookId) return bad(res, "userId and ebookId are required");

    const latestKey = keyForLatest(userId, ebookId);

    let data;
    try {
      // Attempt to load latest.json
      data = await s3
        .getObject({
          Bucket: BUCKET,
          Key: latestKey,
        })
        .promise();
    } catch (e) {
      // If no notes found
      if (e.code === "NoSuchKey") {
        return res.status(404).json({ ok: false, message: "No notes found" });
      }
      throw e; // unknown error → rethrow
    }

    const json = JSON.parse(data.Body.toString("utf8"));
    return res.json({ ok: true, notes: json });
  } catch (err) {
    console.error("[/notes/get] ERR", err);
    return res.status(500).json({ ok: false, message: "Server error loading notes" });
  }
});

/**
 * =================================================================
 * POST /notes/docx
 * ---------------------------------------------------------------
 * Converts user HTML notes into a downloadable DOCX file.
 *
 * Requires:
 *   npm i html-docx-js
 *
 * Output:
 *   Attaches .docx file to response
 * =================================================================
 */
router.post("/docx", async (req, res) => {
  try {
    const { userId, ebookId, html = "" } = req.body || {};
    if (!userId || !ebookId) return bad(res, "userId and ebookId are required");

    // Lazy import (so backend won't crash if library missing)
    let HtmlDocx;
    try {
      HtmlDocx = (await import("html-docx-js")).default;
    } catch (e) {
      console.warn(
        "⚠️ html-docx-js not installed. Run: npm i html-docx-js --save",
        e.message
      );
      return res.status(500).json({
        ok: false,
        message: "docx export not enabled on server (missing dependency html-docx-js)",
      });
    }

    // Convert HTML → DOCX Buffer
    const docxBuffer = HtmlDocx.asBlob(
      `<!doctype html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`
    );

    const filename = `notes_${encodeURIComponent(userId)}_${encodeURIComponent(ebookId)}.docx`;

    // Set HTTP headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Convert Blob → Buffer and send
    return res.status(200).send(Buffer.from(await docxBuffer.arrayBuffer()));
  } catch (err) {
    console.error("[/notes/docx] ERR", err);
    return res.status(500).json({ ok: false, message: "Server error creating docx" });
  }
});

export default router;
