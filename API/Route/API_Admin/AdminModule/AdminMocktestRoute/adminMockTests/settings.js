// routes/adminMockTests/settings.js 

const express = require("express");
const path = require("path");
const multer = require("multer");

// Auth security middleware (Admin/Teacher only)
const { authAccess, requireRoles } = require("../../../../../middleware/auth");

// Import DB and parsed.json helpers from repo.js
const { getById, patchMock, getParsedJson } = require("./repo");

// AWS v3 S3 client
const { s3 } = require("../../../../../Services/aws/s3");

const router = express.Router();

/* ----------------------------- S3 + Multer ----------------------------- */

const S3_BUCKET = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET;

// Multer for file uploads (used only when updating cover image)
const upload = multer({ storage: multer.memoryStorage() });

/**
 * 📌 maybeMultipartUpload
 * This function checks:
 *    - Is request "multipart/form-data"?
 * If YES → enable multer for image upload
 * If NO  → skip multer (normal JSON patch)
 */
function maybeMultipartUpload(req, res, next) {
  const ct = String(req.headers["content-type"] || "").toLowerCase();
  if (ct.startsWith("multipart/form-data")) {
    return upload.single("image")(req, res, next);
  }
  return next();
}

/* ------------------------------- Helpers -------------------------------- */

/**
 * Convert value to boolean properly.
 * "true", "1", "yes" → true
 * "false", "0", "no" → false
 */
function toBool(v) {
  if (typeof v === "boolean") return v;
  if (v == null) return undefined;
  const s = String(v).trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(s)) return true;
  if (["false", "0", "no", "off"].includes(s)) return false;
  return undefined;
}

/**
 * Convert numeric fields safely (duration, breakMinutes, price)
 */
function toNumOrNull(v, { nonNegative = true } = {}) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return nonNegative ? Math.max(0, n) : n;
}

/**
 * Convert tags or sectionDurations into a clean array
 */
function parseArray(val) {
  if (val == null) return undefined;
  if (Array.isArray(val)) return val;

  const s = String(val).trim();
  if (!s) return [];

  try {
    const j = JSON.parse(s);
    if (Array.isArray(j)) return j;
  } catch {}

  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

/* --------------------------------- GET ---------------------------------- */
/**
 * GET /:mockTestId
 * → Fetch settings from DynamoDB (header data)
 */
router.get(
  "/:mockTestId",
  authAccess,
  requireRoles(["SuperAdmin", "Admin", "Teacher"]),
  async (req, res) => {
    try {
      const item = await getById(req.params.mockTestId);
      if (!item) return res.status(404).json({ error: "Not found" });
      res.json(item);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

/* -------------------------------- PATCH --------------------------------- */
/**
 * PATCH /:mockTestId/settings
 *
 * Purpose:
 * - Update mock test metadata:
 *   → Title
 *   → Status
 *   → Duration
 *   → Price / Free
 *   → Tags
 *   → Section durations
 *   → Use Sections (true/false)
 *   → Replace cover image
 */
router.patch(
  "/:mockTestId/settings",
  authAccess,
  requireRoles(["SuperAdmin", "Admin", "Teacher"]),
  maybeMultipartUpload, // only run multer if needed
  async (req, res) => {
    try {
      const { mockTestId } = req.params;

      // Load mock test from DynamoDB
      const current = await getById(mockTestId);
      if (!current) return res.status(404).json({ error: "Not found" });

      // Try reading sections from DynamoDB header
      let sections = Array.isArray(current.sections) ? current.sections : null;

      // If sections missing → read from parsed.json
      if (!sections) {
        let parsed = null;
        try {
          parsed = await getParsedJson(mockTestId);
        } catch (err) {
          console.warn("⚠ parsed.json missing:", err.message);
        }

        if (Array.isArray(parsed?.summary?.sections)) {
          // Convert parsed.json format into DynamoDB-friendly structure
          sections = parsed.summary.sections.map((s, i) => {
            const start =
              s.start != null
                ? Number(s.start)
                : (s.startSerial != null ? Math.max(0, Number(s.startSerial) - 1) : 0);

            const count =
              s.count != null
                ? Number(s.count)
                : (
                    (s.endSerial != null && s.startSerial != null)
                      ? Math.max(0, Number(s.endSerial) - Number(s.startSerial) + 1)
                      : 0
                  );

            return {
              index: i,
              name: String(s.name || `Section ${i + 1}`),
              start,
              count,
            };
          });
        } else {
          sections = [];
        }
      }

      // ----------------------------
      // APPLY INCOMING PATCH FIELDS
      // ----------------------------
      const {
        title,
        status,
        useSections,
        breakMinutes,
        duration,
        sectionDurations,
        level,
        tags,
        isFree,
        price,
      } = req.body || {};

      const patch = {};

      if (title !== undefined) patch.title = String(title);
      if (status !== undefined) patch.status = String(status).toUpperCase();
      if (level !== undefined) patch.level = String(level || "").trim();

      const useSectionsBool = toBool(useSections);
      if (useSectionsBool !== undefined) patch.useSections = useSectionsBool;

      const isFreeBool = toBool(isFree);
      if (isFreeBool !== undefined) patch.isFree = isFreeBool;

      const breakMin = toNumOrNull(breakMinutes);
      if (breakMin !== null && breakMin !== undefined) patch.breakMinutes = breakMin;

      const durationMin = toNumOrNull(duration);
      if (durationMin !== null && durationMin !== undefined) patch.duration = durationMin;

      const priceVal = toNumOrNull(price);
      if (priceVal !== null && priceVal !== undefined) patch.price = priceVal;

      const secDurArr = parseArray(sectionDurations);
      if (secDurArr !== undefined) {
        patch.sectionDurations = secDurArr
          .map((n) => toNumOrNull(n))
          .filter((n) => n !== null && n !== undefined);
      }

      const tagsArr = parseArray(tags);
      if (tagsArr !== undefined) {
        patch.tags = tagsArr.map((t) => String(t || "").trim()).filter(Boolean);
      }

      // If useSections = true → save section structure into DynamoDB
      if (useSectionsBool === true && Array.isArray(sections)) {
        patch.sections = sections;
      }

      // =====================================================
      //  OPTIONAL COVER IMAGE UPLOAD (AWS v3)
      // =====================================================
      if (req.file) {
        if (!S3_BUCKET)
          return res.status(500).json({ error: "S3_BUCKET env not set" });

        const img = req.file;
        const baseKey = `mocktests/${mockTestId}`;
        const ext = (path.extname(img.originalname || "") || ".jpg").toLowerCase();
        const Key = `${baseKey}/cover${ext}`;

        // v3 command import inside function
        const { PutObjectCommand } = require("@aws-sdk/client-s3");

        await s3.send(
          new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key,
            Body: img.buffer,
            ContentType: img.mimetype || "image/jpeg",
          })
        );

        patch.imageUrl = `s3://${S3_BUCKET}/${Key}`;
      }

      // Save patch into DynamoDB
      if (Object.keys(patch).length > 0) {
        patch.updatedAt = new Date().toISOString();
        await patchMock(mockTestId, patch);
      }

      // Return updated settings
      const fresh = await getById(mockTestId);
      res.json({ ok: true, mock: fresh });

    } catch (e) {
      console.error("settings update failed:", e);
      res.status(500).json({ error: e.message });
    }
  }
);

module.exports = router;
