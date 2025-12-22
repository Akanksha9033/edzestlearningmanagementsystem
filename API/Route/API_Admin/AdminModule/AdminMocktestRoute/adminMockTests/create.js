// routes/adminMockTests/create.js

// ⭐ Express Router
const express = require("express");

// ⭐ Multer (to read uploaded files into memory)
const multer = require("multer");

// ⭐ XLSX package — allows reading Excel files
const xlsx = require("xlsx");

// ⭐ Path — used to detect file extension
const path = require("path");

// ⭐ UUID generator for unique mockTestId
const { v4: uuidv4 } = require("uuid");

// ⭐ Import S3 uploader (v3 version: putObject wrapper)
const { putObject } = require("../../../../../Services/aws/s3");

// ⭐ Middlewares for login + role checking
const { authAccess, requireRoles } = require("../../../../../middleware/auth");

// ⭐ Repo functions: getBySlug, createMock, patchMock
//    - getBySlug → check if slug already exists
//    - createMock → save new mock test header
//    - patchMock → update mock test metadata later
const { getBySlug, createMock, patchMock } = require("./repo");

// ⭐ Excel parser used to read questions, marks, sections, etc.
const { extractExcelData } = require("../../../../../utils/excelParser");

// ⭐ Utility to create unique slugs (handles duplicates)
const { slugifyUnique } = require("../../../../../utils/slugifyUnique");

// ⭐ S3 bucket name from environment
const S3_BUCKET = process.env.S3_BUCKET;

const router = express.Router();

// ⭐ Multer config: store files in memory
//    We support file + image inputs
const upload = multer({ storage: multer.memoryStorage() });

/**
 * ⭐ POST /api/admin/mocktests/create-mock
 * Purpose:
 *   → Upload Excel file
 *   → Parse questions
 *   → Create a DRAFT mock test
 *   → Upload source + parsed JSON to S3
 *   → Save optional cover image
 */
router.post(
  "/",
  authAccess,                                       // must be logged in
  requireRoles(["SuperAdmin", "Admin", "Teacher"]), // only allowed roles
  upload.fields([
    { name: "image", maxCount: 1 }, // optional cover image
    { name: "file", maxCount: 1 },  // Excel file
  ]),
  async (req, res) => {
    try {
      // ⭐ Ensure S3 bucket is configured
      if (!S3_BUCKET) {
        return res.status(500).json({ error: "S3_BUCKET env not set" });
      }

      // --------------------------------------------------------------------
      // ⭐ READ & VALIDATE BASIC INPUTS
      // --------------------------------------------------------------------
      const title = String(req.body?.title || "").trim();
      const rawSlug = String(req.body?.slug || "").trim();
      const instituteId = String(req.body?.instituteId || "").trim();
      const duration = req.body?.duration === "" ? null : Number(req.body?.duration);

      const isFreeRaw = req.body?.isFree;
      const priceRaw = req.body?.price;

      if (!title)
        return res.status(400).json({ error: "title is required" });

      if (!instituteId)
        return res.status(400).json({ error: "instituteId is required" });

      // --------------------------------------------------------------------
      // ⭐ HANDLE FREE / PAID LOGIC
      // --------------------------------------------------------------------
      const isFree =
        (typeof isFreeRaw === "string" && isFreeRaw.toLowerCase() === "true") ||
        isFreeRaw === true;

      let finalIsFree = isFree;
      let finalPrice = 0;

      if (!finalIsFree) {
        const parsedPrice = Number(priceRaw);

        if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
          return res.status(400).json({
            error: "price must be a positive number when test is paid",
          });
        }
        finalPrice = parsedPrice;
      }

      // --------------------------------------------------------------------
      // ⭐ READ FILES (Excel + Cover Image)
      // --------------------------------------------------------------------
      const excelFile = (req.files?.file || [])[0];

      if (!excelFile)
        return res.status(400).json({ error: "uploadExcel (.xlsx) is required" });

      if (!/\.xlsx$/i.test(excelFile?.originalname || "")) {
        return res.status(400).json({ error: "Only .xlsx files are allowed" });
      }

      // ⭐ Optional image file
      const imageFile = (req.files?.image || [])[0] || null;

      // --------------------------------------------------------------------
      // ⭐ PARSE EXCEL
      // --------------------------------------------------------------------
      // Create a slug that does not clash with existing slugs
      const uniqueSlug = await slugifyUnique(rawSlug || title, getBySlug);

      // Read Excel workbook
      const workbook = xlsx.read(excelFile.buffer, { type: "buffer" });

      // Parse rows + summary from Excel
      const { rows, summary } = extractExcelData(workbook);

      // --------------------------------------------------------------------
      // ⭐ CREATE INITIAL HEADER (status = DRAFT)
      // --------------------------------------------------------------------
      const mockTestId = uuidv4();
      const now = new Date().toISOString();

      const header = {
        mockTestId,
        slug: uniqueSlug,
        title,
        instituteId,
        status: "DRAFT", // initial status
        duration: duration == null || Number.isNaN(duration) ? null : duration,
        isFree: finalIsFree,
        price: finalPrice,

        // ⭐ default values
        level: null,
        tags: [],
        useSections: false,
        breakMinutes: 10,

        // ⭐ summary extracted from Excel
        totalQuestions: summary.totalQuestions,
        totalMarks: summary.totalMarks,
        sections: summary.sections,
        sectionNames: summary.sectionNames || [],

        createdAt: now,
      };

      // Save header into database
      await createMock(header);

      // --------------------------------------------------------------------
      // ⭐ UPLOAD FILES TO S3
      // --------------------------------------------------------------------
      const baseKey = `mocktests/${mockTestId}`;

      // ⭐ Upload original Excel file
      await putObject({
        Bucket: S3_BUCKET,
        Key: `${baseKey}/source.xlsx`,
        Body: excelFile.buffer,
        ContentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // ⭐ Upload parsed JSON file
      await putObject({
        Bucket: S3_BUCKET,
        Key: `${baseKey}/parsed.json`,
        Body: Buffer.from(JSON.stringify({ rows, summary }, null, 2)),
        ContentType: "application/json",
      });

      // ⭐ Upload optional cover image
      if (imageFile) {
        const ext =
          (path.extname(imageFile.originalname || "") || ".jpg").toLowerCase();

        await putObject({
          Bucket: S3_BUCKET,
          Key: `${baseKey}/cover${ext}`,
          Body: imageFile.buffer,
          ContentType: imageFile.mimetype || "image/jpeg",
        });

        // Update database with image URL
        await patchMock(mockTestId, {
          imageUrl: `s3://${S3_BUCKET}/${baseKey}/cover${ext}`,
        });
      }

      // --------------------------------------------------------------------
      // ⭐ SUCCESS RESPONSE
      // --------------------------------------------------------------------
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

module.exports = router;
