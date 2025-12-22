// API/Route/API_Student/EBook/notesRoutes.js
const express = require("express");
const router = express.Router();

// AWS SDK v3 S3 Client + Commands
const {
  S3Client,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");

const { fromIni } = require("@aws-sdk/credential-provider-ini");
const { randomUUID } = require("crypto");

/* ─────────────────────────────────────────────
   ENVIRONMENT VARIABLES
────────────────────────────────────────────── */
const REGION =
  (process.env.AWS_REGION && String(process.env.AWS_REGION)) ||
  "ap-south-1";

// main bucket for saving student notes
const NOTES_BUCKET =
  process.env.NOTES_BUCKET ||
  process.env.S3_BUCKET ||
  "edzest-bucket";

/**
 * NEW folder structure (current system)
 * s3://bucket/ebooks/notes/{userId}/{bookId}/{chapterId}/{noteId}.json
 */
const NOTES_PREFIX = process.env.NOTES_PREFIX || "ebooks/notes";

/**
 * OLD legacy folder structure (previous system)
 * s3://bucket/notes/{userId}/{ebookId}/{file}.json
 */
const LEGACY_NOTES_PREFIX =
  process.env.LEGACY_NOTES_PREFIX || "notes";

/* ─────────────────────────────────────────────
   CREDENTIAL RESOLUTION
────────────────────────────────────────────── */

// If AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY exist, use them
const hasEnvCreds =
  !!process.env.AWS_ACCESS_KEY_ID &&
  !!process.env.AWS_SECRET_ACCESS_KEY;

const resolvedCredentials = hasEnvCreds
  ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
  : fromIni({
      profile: process.env.AWS_PROFILE || "default",
    });

/* ─────────────────────────────────────────────
   S3 CLIENT (AWS SDK v3)
────────────────────────────────────────────── */
const s3 = new S3Client({
  region: REGION,
  credentials: resolvedCredentials,
});

/* ─────────────────────────────────────────────
   HELPERS
────────────────────────────────────────────── */

// Convert stream → string (for GetObject)
const streamToString = async (stream) =>
  await new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (c) => chunks.push(c));
    stream.on("error", reject);
    stream.on("end", () =>
      resolve(Buffer.concat(chunks).toString("utf-8"))
    );
  });

// Error wrapper for DEV mode
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

  if (process.env.NODE_ENV !== "production") {
    return res.status(500).json(payload);
  }

  return res.status(500).json({ error: fallbackMsg });
}

// Build S3 key for a note
function keyOf({ userId, bookId, chapterId, noteId }) {
  return `${NOTES_PREFIX}/${encodeURIComponent(
    userId
  )}/${encodeURIComponent(bookId)}/${encodeURIComponent(
    chapterId
  )}/${encodeURIComponent(noteId)}.json`;
}

/**
 * List ALL objects under a prefix
 * Handles pagination using ContinuationToken
 */
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

    ContinuationToken = out.IsTruncated
      ? out.NextContinuationToken
      : undefined;
  } while (ContinuationToken);

  return all;
}

/**
 * Build Index for LEGACY notes/ folder
 * Converts old structure → new grouping format
 */
async function buildLegacyIndex(userId) {
  const prefix =
    `${LEGACY_NOTES_PREFIX}/${encodeURIComponent(userId)}/`;
  const objects = await listAllUnderPrefix(prefix);

  const seen = new Map(); // ebookId → count

  for (const o of objects) {
    const key = o.Key || "";
    const parts = key.split("/").filter(Boolean);

    // [notes, userId, ebookId, file.json]
    if (parts.length < 4 || !key.endsWith(".json")) continue;

    const ebookId = decodeURIComponent(parts[2]);
    seen.set(ebookId, (seen.get(ebookId) || 0) + 1);
  }

  // Legacy data is mapped under a dummy chapter "_pad"
  return [...seen.entries()].map(([bookId, count]) => ({
    bookId,
    chapters: [{ chapterId: "_pad", count }],
  }));
}

/* ─────────────────────────────────────────────
   ROUTES START
────────────────────────────────────────────── */

/**
 * SAVE NOTE
 * ------------------------------------------
 * POST /save
 * Saves or updates a note under:
 * ebooks/notes/{userId}/{bookId}/{chapterId}/{noteId}.json
 */
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
      return res.status(400).json({
        error: "userId, bookId, chapterId are required",
      });
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

    // build final S3 key
    const Key = keyOf({ userId, bookId, chapterId, noteId });

    // Debug log in dev mode
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

/**
 * INDEX ROUTE
 * ------------------------------------------
 * GET /index
 * Returns:
 *   - all books of a user
 *   - all chapters within each book
 *   - count of notes in each chapter
 *
 * Includes NEW + LEGACY folder structures.
 */
router.get("/index", async (req, res) => {
  try {
    const userId = String(req.query.userId || "").trim();
    if (!userId)
      return res.status(400).json({ error: "userId required" });

    const prefix =
      `${NOTES_PREFIX}/${encodeURIComponent(userId)}/`;
    const contents = await listAllUnderPrefix(prefix);

    const map = new Map(); // bookId → Map(chapterId → count)

    for (const obj of contents) {
      const key = obj.Key || "";
      const parts = key.split("/").filter(Boolean);

      // new structure: [ebooks,notes,userId,bookId,chapterId,file.json]
      if (parts.length < 6 || !key.endsWith(".json")) continue;

      const bookId = decodeURIComponent(parts[3]);
      const chapterId = decodeURIComponent(parts[4]);

      if (!map.has(bookId)) map.set(bookId, new Map());
      const ch = map.get(bookId);
      ch.set(chapterId, (ch.get(chapterId) || 0) + 1);
    }

    let index = [...map.entries()].map(
      ([bookId, chaptersMap]) => ({
        bookId,
        chapters: [...chaptersMap.entries()].map(
          ([chapterId, count]) => ({
            chapterId,
            count,
          })
        ),
      })
    );

    // Merge legacy structure
    const legacy = await buildLegacyIndex(userId);
    if (legacy.length) {
      const byBook = new Map(index.map((b) => [b.bookId, b]));

      for (const leg of legacy) {
        if (!byBook.has(leg.bookId)) {
          byBook.set(leg.bookId, {
            bookId: leg.bookId,
            chapters: [...leg.chapters],
          });
        } else {
          const existing = byBook.get(leg.bookId);
          const chapterMap = new Map(
            existing.chapters.map((c) => [c.chapterId, c.count])
          );

          for (const lc of leg.chapters) {
            chapterMap.set(
              lc.chapterId,
              (chapterMap.get(lc.chapterId) || 0) + lc.count
            );
          }

          existing.chapters = [...chapterMap.entries()].map(
            ([chapterId, count]) => ({
              chapterId,
              count,
            })
          );

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

/**
 * LIST NOTES FOR A SPECIFIC book + chapter
 * ------------------------------------------
 * GET /
 * Returns all notes inside:
 * ebooks/notes/{userId}/{bookId}/{chapterId}/
 *
 * + Also loads legacy notes if required.
 */
router.get("/", async (req, res) => {
  try {
    const userId = String(req.query.userId || "").trim();
    const bookId = String(req.query.bookId || "").trim();
    const chapterId = String(req.query.chapterId || "").trim();

    if (!userId) return res.status(400).json({ error: "userId required" });
    if (!bookId || !chapterId)
      return res
        .status(400)
        .json({ error: "bookId and chapterId required" });

    const prefix =
      `${NOTES_PREFIX}/${encodeURIComponent(userId)}/${encodeURIComponent(
        bookId
      )}/${encodeURIComponent(chapterId)}/`;

    const contents = await listAllUnderPrefix(prefix);
    const notes = [];

    // NEW format
    for (const obj of contents) {
      if (!obj.Key || !obj.Key.endsWith(".json")) continue;

      const getRes = await s3.send(
        new GetObjectCommand({
          Bucket: NOTES_BUCKET,
          Key: obj.Key,
        })
      );

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
        // ignore malformed JSON
      }
    }

    // Legacy fallback (if no notes OR chapter is "_pad")
    if (
      (notes.length === 0 && chapterId === "_pad") ||
      notes.length === 0
    ) {
      const legacyPrefix =
        `${LEGACY_NOTES_PREFIX}/${encodeURIComponent(userId)}/${encodeURIComponent(
          bookId
        )}/`;

      const legacyObjects = await listAllUnderPrefix(legacyPrefix);

      for (const obj of legacyObjects) {
        if (!obj.Key.endsWith(".json")) continue;

        const getRes = await s3.send(
          new GetObjectCommand({
            Bucket: NOTES_BUCKET,
            Key: obj.Key,
          })
        );

        const raw = await streamToString(getRes.Body);

        try {
          const parsed = JSON.parse(raw);

          notes.push({
            id:
              parsed.id ||
              obj.Key.split("/")
                .pop()
                .replace(/\.json$/, ""),
            userId,
            bookId,
            chapterId: "_pad",
            title: parsed.title || "Notebook",
            text:
              parsed.text || parsed.noteText || "",
            selection:
              parsed.selection ||
              parsed.selectionText ||
              "",
            meta:
              parsed.meta ||
              (parsed.html ? { html: parsed.html } : {}),
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

    // newest → oldest
    notes.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0) -
        new Date(a.updatedAt || a.createdAt || 0)
    );

    res.json({ success: true, notes });
  } catch (err) {
    console.error("notes list failed:", err);
    return devError(res, err, "Failed to fetch notes");
  }
});

/**
 * LIST ALL NOTES FOR USER
 * ------------------------------------------
 * GET /all
 * Returns ALL notes of user,
 * across ALL books & ALL chapters.
 */
router.get("/all", async (req, res) => {
  try {
    const userId = String(req.query.userId || "").trim();
    if (!userId) return res.status(400).json({ error: "userId required" });

    const prefix =
      `${NOTES_PREFIX}/${encodeURIComponent(userId)}/`;
    const contents = await listAllUnderPrefix(prefix);

    const notes = [];

    // New format
    for (const obj of contents) {
      const key = obj.Key || "";
      const parts = key.split("/").filter(Boolean);

      if (parts.length < 6 || !key.endsWith(".json")) continue;

      const bookId = decodeURIComponent(parts[3]);
      const chapterId = decodeURIComponent(parts[4]);

      const getRes = await s3.send(
        new GetObjectCommand({
          Bucket: NOTES_BUCKET,
          Key: key,
        })
      );

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
      } catch {}
    }

    // Legacy folder
    const legacyPrefix =
      `${LEGACY_NOTES_PREFIX}/${encodeURIComponent(userId)}/`;
    const legacyObjects = await listAllUnderPrefix(legacyPrefix);

    for (const obj of legacyObjects) {
      const key = obj.Key || "";
      const parts = key.split("/").filter(Boolean);

      if (parts.length < 4 || !key.endsWith(".json")) continue;

      const bookId = decodeURIComponent(parts[2]);

      const getRes = await s3.send(
        new GetObjectCommand({
          Bucket: NOTES_BUCKET,
          Key: key,
        })
      );

      const raw = await streamToString(getRes.Body);

      try {
        const parsed = JSON.parse(raw);

        notes.push({
          id:
            parsed.id ||
            key.split("/")
              .pop()
              .replace(/\.json$/, ""),
          userId,
          _bookId: bookId,
          _chapterId: "_pad",
          title: parsed.title || "Notebook",
          text:
            parsed.text || parsed.noteText || "",
          selection:
            parsed.selection || parsed.selectionText || "",
          meta:
            parsed.meta ||
            (parsed.html ? { html: parsed.html } : {}),
          createdAt: parsed.createdAt || obj.LastModified,
          updatedAt: parsed.updatedAt || obj.LastModified,
          s3Key: key,
          size: obj.Size,
          lastModified: obj.LastModified,
        });
      } catch {}
    }

    // sort descending
    notes.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0) -
        new Date(a.updatedAt || a.createdAt || 0)
    );

    res.json({ success: true, notes });
  } catch (err) {
    console.error("notes/all failed:", err);
    return devError(res, err, "Failed to fetch all notes");
  }
});

/**
 * DELETE NOTE BY S3 KEY
 * ------------------------------------------
 * DELETE /by-key
 */
router.delete("/by-key", async (req, res) => {
  try {
    const { s3Key } = req.body || {};

    if (!s3Key || typeof s3Key !== "string") {
      return res.status(400).json({ error: "s3Key required" });
    }

    await s3.send(
      new DeleteObjectCommand({
        Bucket: NOTES_BUCKET,
        Key: s3Key,
      })
    );

    res.json({ success: true });
  } catch (err) {
    console.error("notes delete failed:", err);
    return devError(res, err, "Failed to delete note");
  }
});

/**
 * DEBUG ROUTE — Shows environment setup
 */
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
