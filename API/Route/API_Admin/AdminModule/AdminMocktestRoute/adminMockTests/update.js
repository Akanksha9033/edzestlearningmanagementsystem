// routes/adminMockTests/update.js

// Core imports
const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const path = require("path");

// ⭐ AWS v3 S3 wrapper + Commands
const { s3 } = require("../../../../../Services/aws/s3");
const {
  GetObjectCommand,
  PutObjectCommand
} = require("@aws-sdk/client-s3");

// Repo utilities (DB helpers)
const { getById, getBySlug, patchMock } = require("./repo");

// Excel parser
const { extractExcelData } = require("../../../../../utils/excelParser");

// Unique slug generator
const { slugifyUnique } = require("../../../../../utils/slugifyUnique");

// Auth middleware
const { authAccess, requireRoles } = require("../../../../../middleware/auth");

// Env bucket
const S3_BUCKET = process.env.S3_BUCKET;

// Express router
const router = express.Router();

// Multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

/* -------------------------- helpers (local) -------------------------- */
/**
 * buildSectionRanges(rows)
 * → Computes sections from Excel rows
 * → Example: "Math", "Math", "Science" etc.
 * → Creates startSerial/endSerial/count
 */
function buildSectionRanges(rows) {
  const sections = [];
  let last = null;
  let serial = 0;

  for (const r of rows) {
    serial += 1;
    const label = (r?.section || null) || null;
    if (!label) continue; // ignore empty section names

    // New section starts when label changes
    if (label !== last) {
      sections.push({ name: label, start: serial });
      last = label;
    }
  }

  // compute endSerial + count for each section
  sections.forEach((s, i) => {
    const nextStart = sections[i + 1]?.start || rows.length + 1;
    s.count = nextStart - s.start;
    s.end = s.start + s.count - 1;
  });

  // convert to stable section format
  return sections.map(({ name, start, end, count }) => ({
    name,
    startSerial: start,
    endSerial: end,
    count,
  }));
}

/**
 * distinctSectionNames(rows) → collects unique section names
 */
function distinctSectionNames(rows) {
  return Array.from(new Set((rows || []).map(r => r.section).filter(Boolean)));
}

/* --------------------------------------------------------------------
   v3 VERSION — read parsed.json from S3 safely
-------------------------------------------------------------------- */
/**
 * readParsed(mockTestId)
 * Reads mocktests/{id}/parsed.json
 * If key missing → returns EMPTY SAFE STRUCTURE
 */
async function readParsed(mockTestId) {
  if (!S3_BUCKET) throw new Error("S3_BUCKET env not set");

  const Key = `mocktests/${mockTestId}/parsed.json`;

  try {
    const obj = await s3.send(
      new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key
      })
    );

    const text = await obj.Body.transformToString();
    return JSON.parse(text);

  } catch (e) {
    // Missing parsed.json → return safe empty data
    if (e?.name === "NoSuchKey" || e?.$metadata?.httpStatusCode === 404) {
      return {
        rows: [],
        summary: {
          totalQuestions: 0,
          totalMarks: 0,
          sections: [],
          sectionNames: []
        }
      };
    }
    throw e;
  }
}

/* --------------------------------------------------------------------
   v3 VERSION — write parsed.json to S3
-------------------------------------------------------------------- */
/**
 * writeParsed
 * Saves parsed.json in S3 with updated rows & summary
 */
async function writeParsed(mockTestId, rows, summary) {
  if (!S3_BUCKET) throw new Error("S3_BUCKET env not set");

  const Key = `mocktests/${mockTestId}/parsed.json`;

  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key,
      Body: Buffer.from(JSON.stringify({ rows, summary }, null, 2)),
      ContentType: "application/json",
    })
  );
}

/**
 * recomputeSummary
 * Recalculates:
 * - totalQuestions
 * - totalMarks
 * - sections
 * - sectionNames
 */
function recomputeSummary(rows, existing = {}) {
  const computed = {
    totalQuestions: rows.length,
    totalMarks: rows.reduce((a, q) => a + Number(q?.marks ?? 1), 0),
    sections: buildSectionRanges(rows),
    sectionNames: distinctSectionNames(rows),
  };
  return { ...computed, ...(existing || {}) };
}

/* ------------------------------ routes ------------------------------ */

/**
 * PATCH /:mockTestId
 * Updates:
 * - title
 * - slug
 * - duration
 * - image
 * - Excel file (regenerate parsed.json)
 */
router.patch(
  "/:mockTestId",
  authAccess,
  requireRoles(["SuperAdmin", "Admin", "Teacher"]),
  upload.fields([{ name: "image", maxCount: 1 }, { name: "file", maxCount: 1 }]),
  async (req, res) => {
    try {
      if (!S3_BUCKET) return res.status(500).json({ error: "S3_BUCKET env not set" });

      const { mockTestId } = req.params;

      // Load current mock header
      const current = await getById(mockTestId);
      if (!current) return res.status(404).json({ error: "Not found" });

      const patch = {};
      const { title, slug: rawSlug, duration } = req.body || {};

      // update title
      if (title !== undefined) patch.title = String(title);

      // update duration
      if (duration !== undefined)
        patch.duration = duration === "" ? null : Number(duration);

      // slug update
      if (rawSlug !== undefined) {
        const wanted = String(rawSlug || "").trim();
        if (!wanted) return res.status(400).json({ error: "slug cannot be empty" });

        if (wanted !== current.slug) {
          const unique = await slugifyUnique(wanted, getBySlug); // ensure no duplicates
          patch.slug = unique;
        }
      }

      const baseKey = `mocktests/${mockTestId}`;
      const imageFile = (req.files?.image || [])[0] || null;
      const excelFile = (req.files?.file || [])[0] || null;

      /* ------- v3 S3: upload/replace image ------- */
      if (imageFile) {
        const ext =
          (path.extname(imageFile.originalname || "") || ".jpg").toLowerCase();

        await s3.send(
          new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: `${baseKey}/cover${ext}`,
            Body: imageFile.buffer,
            ContentType: imageFile.mimetype || "image/jpeg",
          })
        );

        patch.imageUrl = `s3://${S3_BUCKET}/${baseKey}/cover${ext}`;
      }

      /* -------- v3 S3: upload/replace Excel + parsed.json ---------- */
      if (excelFile) {
        if (!/\.xlsx$/i.test(excelFile.originalname || "")) {
          return res.status(400).json({ error: "Only .xlsx files allowed" });
        }

        // Parse Excel
        const workbook = xlsx.read(excelFile.buffer, { type: "buffer" });
        const { rows, summary } = extractExcelData(workbook);

        // Save Excel source
        await s3.send(
          new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: `${baseKey}/source.xlsx`,
            Body: excelFile.buffer,
            ContentType:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          })
        );

        // Save parsed.json
        await s3.send(
          new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: `${baseKey}/parsed.json`,
            Body: Buffer.from(JSON.stringify({ rows, summary }, null, 2)),
            ContentType: "application/json",
          })
        );

        // Update DB summary info
        patch.totalQuestions = summary.totalQuestions;
        patch.totalMarks = summary.totalMarks;
        patch.sections = summary.sections;
        patch.sectionNames = summary.sectionNames || [];
      }

      // Save patch to DB
      if (Object.keys(patch).length) {
        await patchMock(mockTestId, patch);
      }

      const updated = await getById(mockTestId);
      res.json({ ok: true, mockTest: updated });

    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

/* --------------------------- PATCH full questions --------------------------- */
/**
 * PATCH /:mockTestId/questions
 * Replaces ALL questions in parsed.json
 */
router.patch(
  "/:mockTestId/questions",
  authAccess,
  requireRoles(["SuperAdmin", "Admin", "Teacher"]),
  async (req, res) => {
    try {
      const { mockTestId } = req.params;
      const { rows = [], summary } = req.body || {};

      if (!Array.isArray(rows)) {
        return res.status(400).json({ error: "rows must be array" });
      }

      const finalSummary = recomputeSummary(rows, summary);

      // write parsed.json
      await writeParsed(mockTestId, rows, finalSummary);

      // update DB header
      await patchMock(mockTestId, {
        totalQuestions: finalSummary.totalQuestions,
        totalMarks: finalSummary.totalMarks,
        sections: finalSummary.sections,
        sectionNames: finalSummary.sectionNames || [],
        updatedAt: new Date().toISOString(),
      });

      res.json({ ok: true, summary: finalSummary });

    } catch (e) {
      console.error("save questions error:", e);
      res.status(500).json({ error: "Failed to save" });
    }
  }
);

/* --------------------------- PATCH single question --------------------------- */
/**
 * PATCH /:mockTestId/questions/:index
 * Updates JUST ONE question in parsed.json
 */
router.patch(
  "/:mockTestId/questions/:index",
  authAccess,
  requireRoles(["SuperAdmin", "Admin", "Teacher"]),
  async (req, res) => {
    try {
      const { mockTestId, index } = req.params;
      const idx = Number(index);

      const { rows = [], summary = {} } = await readParsed(mockTestId);

      if (!Number.isInteger(idx) || idx < 0 || idx >= rows.length) {
        return res.status(404).json({ error: "Question index out of range" });
      }

      const incoming = req.body || {};
      const old = rows[idx];

      // Merge incoming with existing
      const merged = {
        ...old,
        ...incoming,
        id: incoming.id || old.id || `q_${idx + 1}`,
        options: Array.isArray(incoming.options)
          ? incoming.options
          : old.options || [],
        marks: Number(incoming.marks ?? old.marks ?? 1),
      };

      // Validate correctness based on question type
      const isMulti = /multi_choice/i.test(merged.questionType || "");
      const optLen = Array.isArray(merged.options)
        ? merged.options.length
        : 0;

      if (isMulti) {
        // Multi correct: allow multiple correct answers
        const raw = Array.isArray(incoming.correct)
          ? incoming.correct
          : Array.isArray(old.correct)
          ? old.correct
          : [];

        merged.correct = [...new Set(
          raw.filter((n) => Number.isInteger(n) && n >= 1 && n <= optLen)
        )].sort((a, b) => a - b);

        merged.answer = null;

      } else {
        // Single choice: answer = index
        const ans = Number.isInteger(incoming.answer)
          ? incoming.answer
          : Number.isInteger(old.answer)
          ? old.answer
          : null;

        merged.answer =
          Number.isInteger(ans) && ans >= 0 && ans < optLen ? ans : null;

        merged.correct = Number.isInteger(merged.answer)
          ? [merged.answer + 1]
          : [];
      }

      // Replace question
      rows[idx] = merged;

      const finalSummary = recomputeSummary(rows, summary);

      await writeParsed(mockTestId, rows, finalSummary);

      await patchMock(mockTestId, {
        totalQuestions: finalSummary.totalQuestions,
        totalMarks: finalSummary.totalMarks,
        sections: finalSummary.sections,
        sectionNames:
          finalSummary.sectionNames || [],
        updatedAt: new Date().toISOString(),
      });

      res.json({ ok: true, summary: finalSummary });

    } catch (e) {
      console.error("single update failed:", e);
      res.status(500).json({ error: "Failed to save question" });
    }
  }
);

/* -------------------------- INSERT one question -------------------------- */
/**
 * POST /:mockTestId/questions
 * Inserts a new question at any position
 */
router.post(
  "/:mockTestId/questions",
  authAccess,
  requireRoles(["SuperAdmin", "Admin", "Teacher"]),
  async (req, res) => {
    try {
      const { mockTestId } = req.params;
      const { question = {}, at } = req.body || {};

      const { rows = [], summary = {} } = await readParsed(mockTestId);

      // Insert index
      const insertAt = Number.isInteger(at)
        ? Math.min(Math.max(at, 0), rows.length)
        : rows.length;

      // Construct new question with defaults
            // Construct new question with defaults
      const q = {
        id: question.id || `q_${Date.now()}`,
        instruction: question.instruction || "",
        question: question.question || "",
        questionType: question.questionType || "Single_Choice",
        options: Array.isArray(question.options)
          ? question.options
          : ["", "", "", ""],
        answer: Number.isInteger(question.answer)
          ? question.answer
          : null,
        explanation: question.explanation || "",
        tags: Array.isArray(question.tags) ? question.tags : [],

        // ⭐ NEW FIELDS COMING FROM FRONTEND / EXCEL
        task: question.task || "",
        approach: question.approach || "",
        domain: question.domain || "",

        section: question.section || "",
        difficulty: (question.difficulty ?? "").toString().trim(),
        marks: Number(question.marks ?? 1),
      };


      const next = [...rows];
      next.splice(insertAt, 0, q);

      const finalSummary = recomputeSummary(next, summary);

      await writeParsed(mockTestId, next, finalSummary);

      await patchMock(mockTestId, {
        totalQuestions: finalSummary.totalQuestions,
        totalMarks: finalSummary.totalMarks,
        sections: finalSummary.sections,
        sectionNames:
          finalSummary.sectionNames || [],
        updatedAt: new Date().toISOString(),
      });

      res.json({
        ok: true,
        index: insertAt,
        summary: finalSummary
      });

    } catch (e) {
      console.error("create question failed:", e);
      res.status(500).json({ error: "Failed to add question" });
    }
  }
);

/* -------------------------- DELETE a question -------------------------- */
/**
 * DELETE /:mockTestId/questions/:index
 * Removes one question
 */
router.delete(
  "/:mockTestId/questions/:index",
  authAccess,
  requireRoles(["SuperAdmin", "Admin", "Teacher"]),
  async (req, res) => {
    try {
      const { mockTestId, index } = req.params;
      const idx = Number(index);

      const { rows = [], summary = {} } = await readParsed(mockTestId);

      if (!Number.isInteger(idx) || idx < 0 || idx >= rows.length) {
        return res.status(404).json({ error: "Question index out of range" });
      }

      const next = rows.filter((_, i) => i !== idx);

      const finalSummary = recomputeSummary(next, summary);

      await writeParsed(mockTestId, next, finalSummary);

      await patchMock(mockTestId, {
        totalQuestions: finalSummary.totalQuestions,
        totalMarks: finalSummary.totalMarks,
        sections: finalSummary.sections,
        sectionNames:
          finalSummary.sectionNames || [],
        updatedAt: new Date().toISOString(),
      });

      res.json({ ok: true, summary: finalSummary });

    } catch (e) {
      console.error("delete question failed:", e);
      res.status(500).json({ error: "Failed to delete question" });
    }
  }
);

module.exports = router;
