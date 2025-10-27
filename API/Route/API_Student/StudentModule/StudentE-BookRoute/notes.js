// routes/notes.js
import express from "express";
import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// ---- S3 Setup (reuses global AWS.config from app.js) ----
const s3 = new AWS.S3({ apiVersion: "2006-03-01" });

const BUCKET = process.env.S3_BUCKET;               // required
const PREFIX = process.env.NOTES_PREFIX || "notes"; // optional "folder" prefix

function keyForLatest(userId, ebookId) {
  return `${PREFIX}/${encodeURIComponent(userId)}/${encodeURIComponent(ebookId)}/latest.json`;
}
function keyForVersion(userId, ebookId, ts, rand) {
  return `${PREFIX}/${encodeURIComponent(userId)}/${encodeURIComponent(ebookId)}/${ts}_${rand}.json`;
}

// Small helper
function bad(res, msg, code = 400) {
  return res.status(code).json({ ok: false, message: msg });
}

/**
 * POST /notes/save
 * Body: { userId, ebookId, html, text, meta }
 * Saves two objects:
 *   - versioned: notes/{userId}/{ebookId}/{timestamp_uuid}.json
 *   - latest:    notes/{userId}/{ebookId}/latest.json   (overwrites pointer)
 */
router.post("/save", async (req, res) => {
  try {
    if (!BUCKET) return bad(res, "S3_BUCKET not configured on server", 500);

    const { userId, ebookId, html = "", text = "", meta = {} } = req.body || {};
    if (!userId || !ebookId) return bad(res, "userId and ebookId are required");

    const now = new Date().toISOString();
    const item = {
      id: uuidv4(),
      userId,
      ebookId,
      html,
      text,
      meta,
      updatedAt: now,
    };

    const versionKey = keyForVersion(userId, ebookId, now, item.id);
    const latestKey = keyForLatest(userId, ebookId);

    // Upload versioned JSON
    await s3
      .putObject({
        Bucket: BUCKET,
        Key: versionKey,
        Body: Buffer.from(JSON.stringify(item, null, 2)),
        ContentType: "application/json; charset=utf-8",
        ACL: "private",
      })
      .promise();

    // Update "latest" pointer
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
 * GET /notes/get?userId=...&ebookId=...
 * Loads the latest saved notes (JSON) from S3.
 */
router.get("/get", async (req, res) => {
  try {
    if (!BUCKET) return bad(res, "S3_BUCKET not configured on server", 500);

    const { userId, ebookId } = req.query || {};
    if (!userId || !ebookId) return bad(res, "userId and ebookId are required");

    const latestKey = keyForLatest(userId, ebookId);

    let data;
    try {
      data = await s3
        .getObject({
          Bucket: BUCKET,
          Key: latestKey,
        })
        .promise();
    } catch (e) {
      if (e.code === "NoSuchKey") {
        return res.status(404).json({ ok: false, message: "No notes found" });
      }
      throw e;
    }

    const json = JSON.parse(data.Body.toString("utf8"));
    return res.json({ ok: true, notes: json });
  } catch (err) {
    console.error("[/notes/get] ERR", err);
    return res.status(500).json({ ok: false, message: "Server error loading notes" });
  }
});

/**
 * POST /notes/docx
 * Body: { userId, ebookId, html }
 * Converts HTML into a .docx Buffer and streams it back.
 * Requires: npm i html-docx-js
 */
router.post("/docx", async (req, res) => {
  try {
    const { userId, ebookId, html = "" } = req.body || {};
    if (!userId || !ebookId) return bad(res, "userId and ebookId are required");

    // Lazy import so the server still boots if the package isn't installed.
    let HtmlDocx;
    try {
      HtmlDocx = (await import("html-docx-js")).default;
    } catch (e) {
      console.warn(
        "⚠️ html-docx-js not installed. Run: npm i html-docx-js --save",
        e.message
      );
      return res
        .status(500)
        .json({ ok: false, message: "docx export not enabled on server (missing dependency html-docx-js)" });
    }

    const docxBuffer = HtmlDocx.asBlob(`<!doctype html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`);

    const filename = `notes_${encodeURIComponent(userId)}_${encodeURIComponent(ebookId)}.docx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(Buffer.from(await docxBuffer.arrayBuffer()));
  } catch (err) {
    console.error("[/notes/docx] ERR", err);
    return res.status(500).json({ ok: false, message: "Server error creating docx" });
  }
});

export default router;
