// routes/adminMockTests/create.js

const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const { putObject } = require("../../../../../Services/aws/s3");
const { authAccess, requireRoles } = require("../../../../../middleware/auth");
const { getBySlug, createMock, patchMock } = require("./repo");
const { extractExcelData } = require("../../../../../utils/excelParser");
const { slugifyUnique } = require("../../../../../utils/slugifyUnique");

const S3_BUCKET = process.env.S3_BUCKET;
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/* ------------------------------------------------------------------ */
/* 🔒 SAFE NORMALIZER (NO LOGIC CHANGE, ONLY DATA FIX)                 */
/* ------------------------------------------------------------------ */
function normalizeCorrectOption(val) {
  if (val == null) return null;

  if (typeof val === "number") return val;

  if (typeof val === "string") {
    const map = { A: 0, B: 1, C: 2, D: 3 };
    const key = val.trim().toUpperCase();
    if (map[key] !== undefined) return map[key];

    const n = Number(val);
    if (!Number.isNaN(n)) return n;
  }

  return null;
}

/* ------------------------------------------------------------------ */
/* POST /api/admin/mocktests/create-mock                               */
/* ------------------------------------------------------------------ */
router.post(
  "/",
  authAccess,
  requireRoles(["SuperAdmin", "Admin", "Teacher"]),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      if (!S3_BUCKET) {
        return res.status(500).json({ error: "S3_BUCKET env not set" });
      }

      /* -------------------- BASIC INPUTS -------------------- */
      const title = String(req.body?.title || "").trim();
      const rawSlug = String(req.body?.slug || "").trim();
      const instituteId = String(req.body?.instituteId || "").trim();
      const duration =
        req.body?.duration === "" ? null : Number(req.body?.duration);

      if (!title) return res.status(400).json({ error: "title is required" });
      if (!instituteId)
        return res.status(400).json({ error: "instituteId is required" });

      /* -------------------- FREE / PAID -------------------- */
      const isFreeRaw = req.body?.isFree;
      const priceRaw = req.body?.price;

      const isFree =
        (typeof isFreeRaw === "string" &&
          isFreeRaw.toLowerCase() === "true") ||
        isFreeRaw === true;

      let finalIsFree = isFree;
      let finalPrice = 0;

      if (!finalIsFree) {
        const parsedPrice = Number(priceRaw);
        if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
          return res
            .status(400)
            .json({ error: "price must be a positive number" });
        }
        finalPrice = parsedPrice;
      }

      /* -------------------- FILES -------------------- */
      const excelFile = (req.files?.file || [])[0];
      if (!excelFile)
        return res.status(400).json({ error: "uploadExcel (.xlsx) is required" });

      if (!/\.xlsx$/i.test(excelFile.originalname || "")) {
        return res.status(400).json({ error: "Only .xlsx files allowed" });
      }

      const imageFile = (req.files?.image || [])[0] || null;

      /* -------------------- EXCEL PARSE -------------------- */
      const uniqueSlug = await slugifyUnique(rawSlug || title, getBySlug);
      const workbook = xlsx.read(excelFile.buffer, { type: "buffer" });

      const { rows, summary } = extractExcelData(workbook);

      /* 🔧 SAFE DATA NORMALIZATION (KEY FIX) */
      const normalizedRows = rows.map((r) => ({
        ...r,
        correct: normalizeCorrectOption(
          r.correct ?? r.CorrectOption ?? r.correctOption
        ),
      }));

      /* -------------------- CREATE HEADER -------------------- */
      const mockTestId = uuidv4();
      const now = new Date().toISOString();

      const header = {
        mockTestId,
        slug: uniqueSlug,
        title,
        instituteId,
        status: "DRAFT",
        duration: duration == null || Number.isNaN(duration) ? null : duration,
        isFree: finalIsFree,
        price: finalPrice,

        level: null,
        tags: [],
        breakMinutes: 10,

        /* 🔧 SECTION FLAG FIX (NO LOGIC CHANGE) */
        useSections:
          Array.isArray(summary.sections) && summary.sections.length > 1,

        totalQuestions: summary.totalQuestions,
        totalMarks: summary.totalMarks,
        sections: summary.sections,
        sectionNames: summary.sectionNames || [],

        createdAt: now,
      };

      await createMock(header);

      /* -------------------- S3 UPLOAD -------------------- */
      const baseKey = `mocktests/${mockTestId}`;

      await putObject({
        Bucket: S3_BUCKET,
        Key: `${baseKey}/source.xlsx`,
        Body: excelFile.buffer,
        ContentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      await putObject({
        Bucket: S3_BUCKET,
        Key: `${baseKey}/parsed.json`,
        Body: Buffer.from(
          JSON.stringify({ rows: normalizedRows, summary }, null, 2)
        ),
        ContentType: "application/json",
      });

      if (imageFile) {
        const ext =
          (path.extname(imageFile.originalname || "") || ".jpg").toLowerCase();

        await putObject({
          Bucket: S3_BUCKET,
          Key: `${baseKey}/cover${ext}`,
          Body: imageFile.buffer,
          ContentType: imageFile.mimetype || "image/jpeg",
        });

        await patchMock(mockTestId, {
          imageUrl: `s3://${S3_BUCKET}/${baseKey}/cover${ext}`,
        });
      }

      /* -------------------- RESPONSE -------------------- */
      return res.json({
        ok: true,
        mockTestId,
        slug: uniqueSlug,
        status: "DRAFT",
        totalQuestions: summary.totalQuestions,
        totalMarks: summary.totalMarks,
        sections: summary.sections,
        sectionNames: summary.sectionNames || [],
      });
    } catch (e) {
      console.error("Create mocktest error:", e);
      return res.status(500).json({ error: e.message });
    }
  }
);

module.exports = router;
