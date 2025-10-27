// API/Route/API_Student/EBook/notesRoutes.js
const express = require("express");
const router = express.Router();

const {
  S3Client,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const { fromIni } = require("@aws-sdk/credential-provider-ini");
const { randomUUID } = require("crypto");

/* ───────────── ENV ───────────── */
const REGION = (process.env.AWS_REGION && String(process.env.AWS_REGION)) || "ap-south-1";
const NOTES_BUCKET = process.env.NOTES_BUCKET || process.env.S3_BUCKET || "edzest-bucket";
/** s3://<bucket>/<NOTES_PREFIX>/{userId}/{bookId}/{chapterId}/{noteId}.json */
const NOTES_PREFIX = process.env.NOTES_PREFIX || "ebooks/notes";
/** ⬇️ Back-compat: legacy layout used by older clients: s3://<bucket>/notes/{userId}/{ebookId}/{file}.json */
const LEGACY_NOTES_PREFIX = process.env.LEGACY_NOTES_PREFIX || "notes";

/* ────────── CREDENTIALS ───────── */
const hasEnvCreds = !!process.env.AWS_ACCESS_KEY_ID && !!process.env.AWS_SECRET_ACCESS_KEY;
const resolvedCredentials = hasEnvCreds
  ? { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY }
  : fromIni({ profile: process.env.AWS_PROFILE || "default" });

/* ───────────── S3 CLIENT ───────────── */
const s3 = new S3Client({ region: REGION, credentials: resolvedCredentials });

/* ──────────── HELPERS ──────────── */
const streamToString = async (stream) =>
  await new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (c) => chunks.push(c));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });

function devError(res, err, fallbackMsg) {
  const payload = {
    success: false,
    error: fallbackMsg,
    name: err?.name,
    code: err?.code || err?.$metadata?.httpStatusCode,
    message: err?.message,
    region: REGION,
    bucket: NOTES_BUCKET,
  };
  if (process.env.NODE_ENV !== "production") return res.status(500).json(payload);
  return res.status(500).json({ error: fallbackMsg });
}

function keyOf({ userId, bookId, chapterId, noteId }) {
  return `${NOTES_PREFIX}/${encodeURIComponent(userId)}/${encodeURIComponent(bookId)}/${encodeURIComponent(chapterId)}/${encodeURIComponent(noteId)}.json`;
}

/** List ALL objects under a prefix (handles pagination). */
async function listAllUnderPrefix(prefix) {
  const all = [];
  let ContinuationToken;
  do {
    const out = await s3.send(
      new ListObjectsV2Command({
        Bucket: NOTES_BUCKET,
        Prefix: prefix,
        MaxKeys: 1000,
        ContinuationToken,
      })
    );
    if (Array.isArray(out.Contents)) all.push(...out.Contents);
    ContinuationToken = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (ContinuationToken);
  return all;
}

/** ⬇️ Build a back-compat index from legacy notes/<userId>/<ebookId>/*.json */
async function buildLegacyIndex(userId) {
  const prefix = `${LEGACY_NOTES_PREFIX}/${encodeURIComponent(userId)}/`;
  const objects = await listAllUnderPrefix(prefix);

  // notes/<userId>/<ebookId>/<file>.json
  const seen = new Map(); // ebookId -> count
  for (const o of objects) {
    const key = o.Key || "";
    const parts = key.split("/").filter(Boolean);
    // [notes, userId, ebookId, file.json]
    if (parts.length < 4 || !key.endsWith(".json")) continue;
    const ebookId = decodeURIComponent(parts[2]);
    seen.set(ebookId, (seen.get(ebookId) || 0) + 1);
  }

  // Convert to new shape: each ebookId becomes a book with a single "_pad" chapter
  return [...seen.entries()].map(([bookId, count]) => ({
    bookId,
    chapters: [{ chapterId: "_pad", count }],
  }));
}

/* ───────────── ROUTES ───────────── */

/** Save / update a note */
router.post("/save", async (req, res) => {
  try {
    const {
      userId,
      bookId,
      chapterId,
      title = "",
      text = "",
      selection = "",
      meta = {},
      id: maybeId,
    } = req.body || {};

    if (!userId || !bookId || !chapterId) {
      return res.status(400).json({ error: "userId, bookId, chapterId are required" });
    }

    const now = new Date().toISOString();
    const noteId = String(maybeId || randomUUID());
    const payload = {
      id: noteId,
      userId,
      bookId,
      chapterId,
      title,
      text,
      selection,
      meta,
      updatedAt: now,
      createdAt: now,
    };

    const Key = keyOf({ userId, bookId, chapterId, noteId });
    // DEBUG: log the exact S3 location
    if (process.env.NODE_ENV !== "production") {
      console.log(`[notes/save] -> s3://${NOTES_BUCKET}/${Key}`);
    }

    await s3.send(
      new PutObjectCommand({
        Bucket: NOTES_BUCKET,
        Key,
        Body: Buffer.from(JSON.stringify(payload, null, 2), "utf-8"),
        ContentType: "application/json",
      })
    );

    return res.json({ success: true, s3Key: Key, id: noteId });
  } catch (err) {
    console.error("notes/save failed:", err);
    return devError(res, err, "Failed to save note");
  }
});

/** Build grouped index by book → chapters (counts) */
router.get("/index", async (req, res) => {
  try {
    const userId = String(req.query.userId || "").trim();
    if (!userId) return res.status(400).json({ error: "userId required" });

    const prefix = `${NOTES_PREFIX}/${encodeURIComponent(userId)}/`;
    const contents = await listAllUnderPrefix(prefix);

    const map = new Map(); // bookId -> Map(chapterId -> count)
    for (const obj of contents) {
      const key = obj.Key || "";
      const parts = key.split("/").filter(Boolean); // [ebooks,notes,userId,bookId,chapterId,note.json]
      if (parts.length < 6 || !key.endsWith(".json")) continue;
      const bookId = decodeURIComponent(parts[3]);
      const chapterId = decodeURIComponent(parts[4]);
      if (!map.has(bookId)) map.set(bookId, new Map());
      const ch = map.get(bookId);
      ch.set(chapterId, (ch.get(chapterId) || 0) + 1);
    }

    let index = [...map.entries()].map(([bookId, chaptersMap]) => ({
      bookId,
      chapters: [...chaptersMap.entries()].map(([chapterId, count]) => ({
        chapterId,
        count,
      })),
    }));

    // ⬇️ Back-compat merge: also include legacy /notes tree
    const legacy = await buildLegacyIndex(userId);
    if (legacy.length) {
      const byBook = new Map(index.map((b) => [b.bookId, b]));
      for (const leg of legacy) {
        if (!byBook.has(leg.bookId)) {
          byBook.set(leg.bookId, { bookId: leg.bookId, chapters: [...leg.chapters] });
        } else {
          const existing = byBook.get(leg.bookId);
          const chapterMap = new Map(existing.chapters.map((c) => [c.chapterId, c.count]));
          for (const lc of leg.chapters) {
            chapterMap.set(lc.chapterId, (chapterMap.get(lc.chapterId) || 0) + lc.count);
          }
          existing.chapters = [...chapterMap.entries()].map(([chapterId, count]) => ({ chapterId, count }));
          byBook.set(leg.bookId, existing);
        }
      }
      index = [...byBook.values()];
    }

    res.json({ success: true, index });
  } catch (err) {
    console.error("notes/index failed:", err);
    return devError(res, err, "Failed to build notes index");
  }
});

/** List all notes for a specific book + chapter */
router.get("/", async (req, res) => {
  try {
    const userId = String(req.query.userId || "").trim();
    const bookId = String(req.query.bookId || "").trim();
    const chapterId = String(req.query.chapterId || "").trim();

    if (!userId) return res.status(400).json({ error: "userId required" });
    if (!bookId || !chapterId) return res.status(400).json({ error: "bookId and chapterId required" });

    const prefix = `${NOTES_PREFIX}/${encodeURIComponent(userId)}/${encodeURIComponent(bookId)}/${encodeURIComponent(chapterId)}/`;
    const contents = await listAllUnderPrefix(prefix);

    const notes = [];
    for (const obj of contents) {
      if (!obj.Key || !obj.Key.endsWith(".json")) continue;
      const getRes = await s3.send(new GetObjectCommand({ Bucket: NOTES_BUCKET, Key: obj.Key }));
      const raw = await streamToString(getRes.Body);
      try {
        const parsed = JSON.parse(raw);
        notes.push({
          ...parsed,
          s3Key: obj.Key,
          size: obj.Size,
          lastModified: obj.LastModified,
        });
      } catch {
        /* ignore malformed */
      }
    }

    // ⬇️ Back-compat: if none in new tree OR specifically requesting the freeform pad,
    // read legacy /notes/<userId>/<ebookId>/*.json and map into chapter "_pad"
    if ((notes.length === 0 && chapterId === "_pad") || notes.length === 0) {
      const legacyPrefix = `${LEGACY_NOTES_PREFIX}/${encodeURIComponent(userId)}/${encodeURIComponent(bookId)}/`;
      const legacyObjects = await listAllUnderPrefix(legacyPrefix);

      for (const obj of legacyObjects) {
        if (!obj.Key || !obj.Key.endsWith(".json")) continue;
        const getRes = await s3.send(new GetObjectCommand({ Bucket: NOTES_BUCKET, Key: obj.Key }));
        const raw = await streamToString(getRes.Body);
        try {
          const parsed = JSON.parse(raw);
          notes.push({
            id: parsed.id || obj.Key.split("/").pop().replace(/\.json$/, ""),
            userId,
            bookId, // legacy ebookId -> new bookId
            chapterId: "_pad",
            title: parsed.title || "Notebook",
            text: parsed.text || parsed.noteText || "",
            selection: parsed.selection || parsed.selectionText || "",
            meta: parsed.meta || (parsed.html ? { html: parsed.html } : {}),
            createdAt: parsed.createdAt || obj.LastModified,
            updatedAt: parsed.updatedAt || obj.LastModified,
            s3Key: obj.Key,
            size: obj.Size,
            lastModified: obj.LastModified,
          });
        } catch {
          /* ignore malformed JSON */
        }
      }
    }

    notes.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
    );

    res.json({ success: true, notes });
  } catch (err) {
    console.error("notes list failed:", err);
    return devError(res, err, "Failed to fetch notes");
  }
});

/** NEW: List ALL notes across ALL books/chapters for a user */
router.get("/all", async (req, res) => {
  try {
    const userId = String(req.query.userId || "").trim();
    if (!userId) return res.status(400).json({ error: "userId required" });

    const prefix = `${NOTES_PREFIX}/${encodeURIComponent(userId)}/`;
    const contents = await listAllUnderPrefix(prefix);

    const notes = [];
    for (const obj of contents) {
      const key = obj.Key || "";
      const parts = key.split("/").filter(Boolean);
      if (parts.length < 6 || !key.endsWith(".json")) continue;
      const bookId = decodeURIComponent(parts[3]);
      const chapterId = decodeURIComponent(parts[4]);

      const getRes = await s3.send(new GetObjectCommand({ Bucket: NOTES_BUCKET, Key: key }));
      const raw = await streamToString(getRes.Body);
      try {
        const parsed = JSON.parse(raw);
        notes.push({
          ...parsed,
          _bookId: bookId,
          _chapterId: chapterId,
          s3Key: key,
          size: obj.Size,
          lastModified: obj.LastModified,
        });
      } catch {
        /* ignore */
      }
    }

    // ⬇️ Back-compat: also pull from legacy /notes tree and map into _pad chapter
    const legacyPrefix = `${LEGACY_NOTES_PREFIX}/${encodeURIComponent(userId)}/`;
    const legacyObjects = await listAllUnderPrefix(legacyPrefix);
    for (const obj of legacyObjects) {
      const key = obj.Key || "";
      const parts = key.split("/").filter(Boolean);
      // [notes, userId, ebookId, file.json]
      if (parts.length < 4 || !key.endsWith(".json")) continue;
      const bookId = decodeURIComponent(parts[2]);

      const getRes = await s3.send(new GetObjectCommand({ Bucket: NOTES_BUCKET, Key: key }));
      const raw = await streamToString(getRes.Body);
      try {
        const parsed = JSON.parse(raw);
        notes.push({
          id: parsed.id || key.split("/").pop().replace(/\.json$/, ""),
          userId,
          _bookId: bookId,
          _chapterId: "_pad",
          title: parsed.title || "Notebook",
          text: parsed.text || parsed.noteText || "",
          selection: parsed.selection || parsed.selectionText || "",
          meta: parsed.meta || (parsed.html ? { html: parsed.html } : {}),
          createdAt: parsed.createdAt || obj.LastModified,
          updatedAt: parsed.updatedAt || obj.LastModified,
          s3Key: key,
          size: obj.Size,
          lastModified: obj.LastModified,
        });
      } catch {
        /* ignore */
      }
    }

    notes.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
    );

    res.json({ success: true, notes });
  } catch (err) {
    console.error("notes/all failed:", err);
    return devError(res, err, "Failed to fetch all notes");
  }
});

/** Delete a note by S3 key */
router.delete("/by-key", async (req, res) => {
  try {
    const { s3Key } = req.body || {};
    if (!s3Key || typeof s3Key !== "string") {
      return res.status(400).json({ error: "s3Key required" });
    }
    await s3.send(new DeleteObjectCommand({ Bucket: NOTES_BUCKET, Key: s3Key }));
    res.json({ success: true });
  } catch (err) {
    console.error("notes delete failed:", err);
    return devError(res, err, "Failed to delete note");
  }
});

/** Debug */
router.get("/__debug", (req, res) => {
  res.json({
    ok: true,
    region: REGION,
    bucket: NOTES_BUCKET,
    prefixExample: `${NOTES_PREFIX}/<userId>/`,
    legacyPrefixExample: `${LEGACY_NOTES_PREFIX}/<userId>/`,
    hasEnvCreds,
    profile: process.env.AWS_PROFILE || "default",
    nodeEnv: process.env.NODE_ENV,
  });
});

module.exports = router;
