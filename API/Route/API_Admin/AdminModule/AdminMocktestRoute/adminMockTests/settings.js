// // routes/adminMockTests/settings.js
// const express = require("express");
// const path = require("path");
// const multer = require("multer");

// const { authAccess, requireRoles } = require("../../../../../middleware/auth");
// // ⬇️ Bring in getParsedJson from repo (you'll add/export it there)
// const { getById, patchMock, getParsedJson } = require("./repo");
// const { s3 } = require("../../../../../Services/aws/s3");

// const router = express.Router();

// /* ----------------------------- S3 + Multer ----------------------------- */

// const S3_BUCKET = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET;
// const upload = multer({ storage: multer.memoryStorage() });

// /** Only run multer when the request is multipart/form-data */
// function maybeMultipartUpload(req, res, next) {
//   const ct = String(req.headers["content-type"] || "").toLowerCase();
//   if (ct.startsWith("multipart/form-data")) {
//     return upload.single("image")(req, res, next);
//   }
//   return next();
// }

// /* ------------------------------- Helpers -------------------------------- */

// function toBool(v) {
//   if (typeof v === "boolean") return v;
//   if (v == null) return undefined;
//   const s = String(v).trim().toLowerCase();
//   if (["true", "1", "yes", "on"].includes(s)) return true;
//   if (["false", "0", "no", "off"].includes(s)) return false;
//   return undefined;
// }
// function toNumOrNull(v, { nonNegative = true } = {}) {
//   if (v === "" || v === null || v === undefined) return null;
//   const n = Number(v);
//   if (!Number.isFinite(n)) return null;
//   return nonNegative ? Math.max(0, n) : n;
// }
// /** Parse array that may arrive as JSON string, comma string, or repeated fields */
// function parseArray(val) {
//   if (val == null) return undefined;
//   if (Array.isArray(val)) return val;
//   const s = String(val).trim();
//   if (!s) return [];
//   try {
//     const j = JSON.parse(s);
//     if (Array.isArray(j)) return j;
//   } catch {}
//   // comma separated
//   return s.split(",").map((x) => x.trim()).filter(Boolean);
// }

// /* --------------------------------- GET ---------------------------------- */
// /**
//  * GET /api/admin/mocktests/mock-settings/:mockTestId
//  */
// router.get(
//   "/:mockTestId",
//   authAccess,
//   requireRoles(["SuperAdmin", "Admin", "Teacher"]),
//   async (req, res) => {
//     try {
//       const item = await getById(req.params.mockTestId);
//       if (!item) return res.status(404).json({ error: "Not found" });
//       res.json(item);
//     } catch (e) {
//       res.status(500).json({ error: e.message });
//     }
//   }
// );

// /* -------------------------------- PATCH --------------------------------- */
// /**
//  * PATCH /api/admin/mocktests/mock-settings/:mockTestId/settings
//  * Accepts JSON or multipart/form-data.
//  * Body supports:
//  *   title?: string
//  *   status?: "DRAFT" | "PUBLISHED" | "UNPUBLISHED"
//  *   useSections?: boolean
//  *   breakMinutes?: number (minutes)
//  *   duration?: number (minutes)
//  *   sectionDurations?: number[] (minutes)
//  *   level?: string
//  *   tags?: string[]
//  *   image?: file (multipart only)
//  */
// router.patch(
//   "/:mockTestId/settings",
//   authAccess,
//   requireRoles(["SuperAdmin", "Admin", "Teacher"]),
//   maybeMultipartUpload,
//   async (req, res) => {
//     try {
//       const { mockTestId } = req.params;

//       const current = await getById(mockTestId);
//       if (!current) return res.status(404).json({ error: "Not found" });

//       // Try to have sections available on the item:
//       let sections = Array.isArray(current.sections) ? current.sections : null;

//       if (!sections) {
//         // Pull from parsed.json (SRM) so student loaders see it in DDB:
//         const parsed = await getParsedJson(mockTestId); // implement/export in ./repo
//         if (Array.isArray(parsed?.summary?.sections)) {
//           sections = parsed.summary.sections.map((s, i) => {
//             // prefer 'start' if the parser wrote it; else fallback to startSerial-1
//             const start =
//               s.start != null
//                 ? Number(s.start)
//                 : (s.startSerial != null ? Math.max(0, Number(s.startSerial) - 1) : 0);
//             // prefer 'count' if parser wrote it; else derive from serials
//             const count =
//               s.count != null
//                 ? Number(s.count)
//                 : (
//                     (s.endSerial != null && s.startSerial != null)
//                       ? Math.max(0, Number(s.endSerial) - Number(s.startSerial) + 1)
//                       : 0
//                   );
//             return {
//               index: i,
//               name: String(s.name || `Section ${i + 1}`),
//               start,
//               count,
//             };
//           });
//         } else {
//           sections = [];
//         }
//       }

//       const {
//         title,
//         status,
//         useSections,
//         breakMinutes,
//         duration,
//         sectionDurations,  // array (JSON / CSV / repeated)
//         level,
//         tags,              // array (JSON / CSV / repeated)
//       } = req.body || {};

//       const patch = {};




//       // Simple strings
//       if (title !== undefined) patch.title = String(title);
//       if (status !== undefined) patch.status = String(status).toUpperCase(); // DRAFT | PUBLISHED | UNPUBLISHED
//       if (level !== undefined) patch.level = String(level || "").trim();

//       // Booleans
//       const useSectionsBool = toBool(useSections);
//       if (useSectionsBool !== undefined) patch.useSections = useSectionsBool;

//       // Numbers (minutes)
//       const breakMin = toNumOrNull(breakMinutes);
//       if (breakMin !== null && breakMin !== undefined) patch.breakMinutes = breakMin;

//       const durationMin = toNumOrNull(duration);
//       if (durationMin !== null && durationMin !== undefined) patch.duration = durationMin;

//       // Arrays
//       const secDurArr = parseArray(sectionDurations);
//       if (secDurArr !== undefined) {
//         patch.sectionDurations = secDurArr
//           .map((n) => toNumOrNull(n))
//           .filter((n) => n !== null && n !== undefined);
//       }

//       const tagsArr = parseArray(tags);
//       if (tagsArr !== undefined) {
//         patch.tags = tagsArr.map((t) => String(t || "").trim()).filter(Boolean);
//       }

//       // 🔴 Critical: if section mode is being used, persist sections on the mock item
//       // so student attempt creation can always see them in DDB.
//       if (useSectionsBool === true && Array.isArray(sections)) {
//         patch.sections = sections;
//       }

//       // Optional image upload to S3
//       if (req.file) {
//         if (!S3_BUCKET) return res.status(500).json({ error: "S3_BUCKET env not set" });
//         const img = req.file;
//         const baseKey = `mocktests/${mockTestId}`;
//         const ext = (path.extname(img.originalname || "") || ".jpg").toLowerCase();
//         const Key = `${baseKey}/cover${ext}`;

//         await s3.putObject({
//           Bucket: S3_BUCKET,
//           Key,
//           Body: img.buffer,
//           ContentType: img.mimetype || "image/jpeg",
//         }).promise();

//         patch.imageUrl = `s3://${S3_BUCKET}/${Key}`;
//       }

//       // Only patch when there is something to update
//       if (Object.keys(patch).length > 0) {
//         patch.updatedAt = new Date().toISOString();
//         await patchMock(mockTestId, patch);
//       }

//       const fresh = await getById(mockTestId);
//       res.json({ ok: true, mock: fresh });
//     } catch (e) {
//       console.error("settings update failed:", e);
//       res.status(500).json({ error: e.message });
//     }
//   }
// );

// module.exports = router;
// routes/adminMockTests/settings.js 
const express = require("express");
const path = require("path");
const multer = require("multer");

const { authAccess, requireRoles } = require("../../../../../middleware/auth");
// ⬇️ Bring in getParsedJson from repo (you'll add/export it there)
const { getById, patchMock, getParsedJson } = require("./repo");
const { s3 } = require("../../../../../Services/aws/s3");

const router = express.Router();

/* ----------------------------- S3 + Multer ----------------------------- */

const S3_BUCKET = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET;
const upload = multer({ storage: multer.memoryStorage() });

/** Only run multer when the request is multipart/form-data */
function maybeMultipartUpload(req, res, next) {
  const ct = String(req.headers["content-type"] || "").toLowerCase();
  if (ct.startsWith("multipart/form-data")) {
    return upload.single("image")(req, res, next);
  }
  return next();
}

/* ------------------------------- Helpers -------------------------------- */

function toBool(v) {
  if (typeof v === "boolean") return v;
  if (v == null) return undefined;
  const s = String(v).trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(s)) return true;
  if (["false", "0", "no", "off"].includes(s)) return false;
  return undefined;
}
function toNumOrNull(v, { nonNegative = true } = {}) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return nonNegative ? Math.max(0, n) : n;
}
/** Parse array that may arrive as JSON string, comma string, or repeated fields */
function parseArray(val) {
  if (val == null) return undefined;
  if (Array.isArray(val)) return val;
  const s = String(val).trim();
  if (!s) return [];
  try {
    const j = JSON.parse(s);
    if (Array.isArray(j)) return j;
  } catch {}
  // comma separated
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

/* --------------------------------- GET ---------------------------------- */
/**
 * GET /api/admin/mocktests/mock-settings/:mockTestId
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
 * PATCH /api/admin/mocktests/mock-settings/:mockTestId/settings
 * Accepts JSON or multipart/form-data.
 * Body supports:
 *   title?: string
 *   status?: "DRAFT" | "PUBLISHED" | "UNPUBLISHED"
 *   useSections?: boolean
 *   breakMinutes?: number (minutes)
 *   duration?: number (minutes)
 *   sectionDurations?: number[] (minutes)
 *   level?: string
 *   tags?: string[]
 *   image?: file (multipart only)
 *   isFree?: boolean | "true"/"false"/"1"/"0"
 *   price?: number (₹)
 */
router.patch(
  "/:mockTestId/settings",
  authAccess,
  requireRoles(["SuperAdmin", "Admin", "Teacher"]),
  maybeMultipartUpload,
  async (req, res) => {
    try {
      const { mockTestId } = req.params;

      const current = await getById(mockTestId);
      if (!current) return res.status(404).json({ error: "Not found" });

      // Try to have sections available on the item:
      let sections = Array.isArray(current.sections) ? current.sections : null;

      if (!sections) {
        // Pull from parsed.json (SRM) so student loaders see it in DDB:
        const parsed = await getParsedJson(mockTestId); // implement/export in ./repo
        if (Array.isArray(parsed?.summary?.sections)) {
          sections = parsed.summary.sections.map((s, i) => {
            // prefer 'start' if the parser wrote it; else fallback to startSerial-1
            const start =
              s.start != null
                ? Number(s.start)
                : (s.startSerial != null ? Math.max(0, Number(s.startSerial) - 1) : 0);
            // prefer 'count' if parser wrote it; else derive from serials
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

      const {
        title,
        status,
        useSections,
        breakMinutes,
        duration,
        sectionDurations,  // array (JSON / CSV / repeated)
        level,
        tags,              // array (JSON / CSV / repeated)
        // ⬇️ NEW: for free/paid control
        isFree,
        price,
      } = req.body || {};

      const patch = {};

      // Simple strings
      if (title !== undefined) patch.title = String(title);
      if (status !== undefined) patch.status = String(status).toUpperCase(); // DRAFT | PUBLISHED | UNPUBLISHED
      if (level !== undefined) patch.level = String(level || "").trim();

      // Booleans
      const useSectionsBool = toBool(useSections);
      if (useSectionsBool !== undefined) patch.useSections = useSectionsBool;

      // ⬇️ NEW: isFree toggle
      const isFreeBool = toBool(isFree);
      if (isFreeBool !== undefined) {
        patch.isFree = isFreeBool;
      }

      // Numbers (minutes)
      const breakMin = toNumOrNull(breakMinutes);
      if (breakMin !== null && breakMin !== undefined) patch.breakMinutes = breakMin;

      const durationMin = toNumOrNull(duration);
      if (durationMin !== null && durationMin !== undefined) patch.duration = durationMin;

      // ⬇️ NEW: price (₹)
      const priceVal = toNumOrNull(price, { nonNegative: true });
      if (priceVal !== null && priceVal !== undefined) {
        patch.price = priceVal;
      }

      // Arrays
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

      // 🔴 Critical: if section mode is being used, persist sections on the mock item
      // so student attempt creation can always see them in DDB.
      if (useSectionsBool === true && Array.isArray(sections)) {
        patch.sections = sections;
      }

      // Optional image upload to S3
      if (req.file) {
        if (!S3_BUCKET) return res.status(500).json({ error: "S3_BUCKET env not set" });
        const img = req.file;
        const baseKey = `mocktests/${mockTestId}`;
        const ext = (path.extname(img.originalname || "") || ".jpg").toLowerCase();
        const Key = `${baseKey}/cover${ext}`;

        await s3.putObject({
          Bucket: S3_BUCKET,
          Key,
          Body: img.buffer,
          ContentType: img.mimetype || "image/jpeg",
        }).promise();

        patch.imageUrl = `s3://${S3_BUCKET}/${Key}`;
      }

      // Only patch when there is something to update
      if (Object.keys(patch).length > 0) {
        patch.updatedAt = new Date().toISOString();
        await patchMock(mockTestId, patch);
      }

      const fresh = await getById(mockTestId);
      res.json({ ok: true, mock: fresh });
    } catch (e) {
      console.error("settings update failed:", e);
      res.status(500).json({ error: e.message });
    }
  }
);

module.exports = router;
