// routes/adminMockTests/create.js
const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { s3 } = require("../../../../../Services/aws/s3");
const { authAccess, requireRoles } = require("../../../../../middleware/auth");

const { getBySlug, createMock, patchMock } = require("./repo");
const { extractExcelData } = require("../../../../../utils/excelParser");
const { slugifyUnique } = require("../../../../../utils/slugifyUnique");

const S3_BUCKET = process.env.S3_BUCKET;
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/admin/mocktests/create-mock
 * Creates a new MockTest (DRAFT) from an uploaded Excel.
 */
router.post(
  "/",
  authAccess,
  requireRoles(["SuperAdmin", "Admin", "Teacher"]),
  upload.fields([{ name: "image", maxCount: 1 }, { name: "file", maxCount: 1 }]),
  async (req, res) => {
    try {
      if (!S3_BUCKET) {
        return res.status(500).json({ error: "S3_BUCKET env not set" });
      }

      // ---- Inputs ----
      const title = String(req.body?.title || "").trim();
      const rawSlug = String(req.body?.slug || "").trim();
      const instituteId = String(req.body?.instituteId || "").trim();
      const duration = req.body?.duration === "" ? null : Number(req.body?.duration);
      const isFreeRaw = req.body?.isFree;
      const priceRaw = req.body?.price;

      if (!title) return res.status(400).json({ error: "title is required" });
      if (!instituteId) return res.status(400).json({ error: "instituteId is required" });

      // ---- Free/Paid ----
      const isFree =
        (typeof isFreeRaw === "string" && isFreeRaw.toLowerCase() === "true") ||
        isFreeRaw === true;
      let finalIsFree = isFree;
      let finalPrice = 0;

      if (!finalIsFree) {
        const parsedPrice = Number(priceRaw);
        if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
          return res
            .status(400)
            .json({ error: "price must be a positive number when test is paid" });
        }
        finalPrice = parsedPrice;
      }

      // ---- Files ----
      const excelFile = (req.files?.file || [])[0];
      if (!excelFile) return res.status(400).json({ error: "uploadExcel (.xlsx) is required" });
      if (!/\.xlsx$/i.test(excelFile?.originalname || "")) {
        return res.status(400).json({ error: "Only .xlsx files are allowed" });
      }
      const imageFile = (req.files?.image || [])[0] || null;

      // ---- Parse Excel ----
      const uniqueSlug = await slugifyUnique(rawSlug || title, getBySlug);
      const workbook = xlsx.read(excelFile.buffer, { type: "buffer" });
      const { rows, summary } = extractExcelData(workbook);
      // summary includes: totalQuestions, totalMarks, sections[], sectionNames[]

      // ---- Create header (DRAFT) ----
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
        useSections: false,
        breakMinutes: 10,
        totalQuestions: summary.totalQuestions,
        totalMarks: summary.totalMarks,
        sections: summary.sections,               // detailed section ranges
        sectionNames: summary.sectionNames || [], // distinct section labels for filters
        createdAt: now,
      };
      await createMock(header);

      // ---- Upload to S3 ----
      const baseKey = `mocktests/${mockTestId}`;

      await s3.putObject({
        Bucket: S3_BUCKET,
        Key: `${baseKey}/source.xlsx`,
        Body: excelFile.buffer,
        ContentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }).promise();

      await s3.putObject({
        Bucket: S3_BUCKET,
        Key: `${baseKey}/parsed.json`,
        Body: Buffer.from(JSON.stringify({ rows, summary }, null, 2)),
        ContentType: "application/json",
      }).promise();

      if (imageFile) {
        const ext = (path.extname(imageFile.originalname || "") || ".jpg").toLowerCase();
        await s3.putObject({
          Bucket: S3_BUCKET,
          Key: `${baseKey}/cover${ext}`,
          Body: imageFile.buffer,
          ContentType: imageFile.mimetype || "image/jpeg",
        }).promise();
        await patchMock(mockTestId, { imageUrl: `s3://${S3_BUCKET}/${baseKey}/cover${ext}` });
      }

      // ---- Response ----
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
      res.status(500).json({ error: e.message });
    }
  }
);

/**
 * GET /api/admin/mocktests/create-mock/check-slug?slug=...
 * Checks whether a slug is available.
 */
router.get(
  "/check-slug",
  authAccess,
  requireRoles(["SuperAdmin", "Admin", "Teacher"]),
  async (req, res) => {
    try {
      const slug = String(req.query.slug || "").trim().toLowerCase();
      if (!slug) return res.status(400).json({ error: "slug is required" });
      const item = await getBySlug(slug);
      res.json({ available: !item });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

module.exports = router;
