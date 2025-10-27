const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const path = require("path");
const { s3 } = require("../../../../../Services/aws/s3");
const { getById, getBySlug, patchMock } = require("./repo");
const { extractExcelData } = require("../../../../../utils/excelParser");
const { slugifyUnique } = require("../../../../../utils/slugifyUnique");
const { authAccess, requireRoles } = require("../../../../../middleware/auth");

const S3_BUCKET = process.env.S3_BUCKET;
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/* -------------------------- helpers (local) -------------------------- */

// build detailed, contiguous section ranges from rows (UI-facing "sections")
function buildSectionRanges(rows) {
  const sections = [];
  let last = null;
  let serial = 0;
  for (const r of rows) {
    serial += 1;
    const label = (r?.section || null) || null;
    if (!label) continue;
    if (label !== last) {
      sections.push({ name: label, start: serial });
      last = label;
    }
  }
  sections.forEach((s, i) => {
    const nextStart = sections[i + 1]?.start || rows.length + 1;
    s.count = nextStart - s.start;
    s.end = s.start + s.count - 1;
  });
  return sections.map(({ name, start, end, count }) => ({
    name,
    startSerial: start,
    endSerial: end,
    count,
  }));
}

// return unique section labels list (Excel/parsed -> UI dropdowns/filters)
function distinctSectionNames(rows) {
  return Array.from(new Set((rows || []).map(r => r.section).filter(Boolean)));
}

// read parsed.json from S3 (safe default if missing)
async function readParsed(mockTestId) {
  const Key = `mocktests/${mockTestId}/parsed.json`;
  if (!S3_BUCKET) throw new Error("S3_BUCKET env not set");
  try {
    const r = await s3.getObject({ Bucket: S3_BUCKET, Key }).promise();
    return JSON.parse(r.Body.toString("utf-8")); // { rows, summary }
  } catch (e) {
    if (e && (e.code === "NoSuchKey" || e.code === "NotFound")) {
      return { rows: [], summary: { totalQuestions: 0, totalMarks: 0, sections: [], sectionNames: [] } };
    }
    throw e;
  }
}

// write parsed.json to S3
async function writeParsed(mockTestId, rows, summary) {
  const Key = `mocktests/${mockTestId}/parsed.json`;
  if (!S3_BUCKET) throw new Error("S3_BUCKET env not set");
  await s3.putObject({
    Bucket: S3_BUCKET,
    Key,
    Body: Buffer.from(JSON.stringify({ rows, summary }, null, 2)),
    ContentType: "application/json",
  }).promise();
}

// recompute summary matching parser shape
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

/** PATCH header/cover/excel (re-parse and persist parsed.json + header fields) */
router.patch(
  "/:mockTestId",
  authAccess,
  requireRoles(["SuperAdmin", "Admin", "Teacher"]),
  upload.fields([{ name: "image", maxCount: 1 }, { name: "file", maxCount: 1 }]),
  async (req, res) => {
    try {
      if (!S3_BUCKET) return res.status(500).json({ error: "S3_BUCKET env not set" });

      const { mockTestId } = req.params;
      const current = await getById(mockTestId);
      if (!current) return res.status(404).json({ error: "Not found" });

      const patch = {};
      const { title, slug: rawSlug, duration } = req.body || {};

      if (title !== undefined) patch.title = String(title);
      if (duration !== undefined) patch.duration = duration === "" ? null : Number(duration);

      // ensure unique slug when changed
      if (rawSlug !== undefined) {
        const wanted = String(rawSlug || "").trim();
        if (!wanted) return res.status(400).json({ error: "slug cannot be empty" });
        if (wanted !== current.slug) {
          const unique = await slugifyUnique(wanted, getBySlug);
          patch.slug = unique;
        }
      }

      const baseKey = `mocktests/${mockTestId}`;
      const imageFile = (req.files?.image || [])[0] || null;
      const excelFile = (req.files?.file || [])[0] || null;

      // upload/replace cover image
      if (imageFile) {
        const ext = (path.extname(imageFile.originalname || "") || ".jpg").toLowerCase();
        await s3.putObject({
          Bucket: S3_BUCKET,
          Key: `${baseKey}/cover${ext}`,
          Body: imageFile.buffer,
          ContentType: imageFile.mimetype || "image/jpeg",
        }).promise();
        patch.imageUrl = `s3://${S3_BUCKET}/${baseKey}/cover${ext}`;
      }

      // upload/replace excel -> parse -> overwrite source.xlsx + parsed.json
      if (excelFile) {
        if (!/\.xlsx$/i.test(excelFile.originalname || "")) {
          return res.status(400).json({ error: "Only .xlsx files are allowed" });
        }

        const workbook = xlsx.read(excelFile.buffer, { type: "buffer" });
        const { rows, summary } = extractExcelData(workbook);

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

        // update header counters/sections in Dynamo
        patch.totalQuestions = summary.totalQuestions;
        patch.totalMarks = summary.totalMarks;
        patch.sections = summary.sections;
        patch.sectionNames = summary.sectionNames || [];
      }

      if (Object.keys(patch).length) await patchMock(mockTestId, patch);

      const updated = await getById(mockTestId);
      res.json({ ok: true, mockTest: updated });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

/** PATCH whole questions array (persist parsed.json + recompute summary/header) */
router.patch(
  "/:mockTestId/questions",
  authAccess,
  requireRoles(["SuperAdmin", "Admin", "Teacher"]),
  async (req, res) => {
    try {
      const { mockTestId } = req.params;
      const { rows = [], summary } = req.body || {};
      if (!Array.isArray(rows)) return res.status(400).json({ error: "rows must be an array" });
      if (!S3_BUCKET) return res.status(500).json({ error: "S3_BUCKET env not set" });

      const finalSummary = recomputeSummary(rows, summary);
      await writeParsed(mockTestId, rows, finalSummary);

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

/** PATCH one question at index (merge fields, persist, recompute header) */
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
      const merged = {
        ...rows[idx],
        ...incoming,
        id: incoming.id || rows[idx].id || `q_${idx + 1}`,
        options: Array.isArray(incoming.options) ? incoming.options : (rows[idx].options || []),
        marks: Number(incoming.marks ?? rows[idx].marks ?? 1),
      };

      // normalize correctness by type
 const isMulti = /multi_choice/i.test(merged.questionType || "");
 const optLen = Array.isArray(merged.options) ? merged.options.length : 0;
 if (isMulti) {
   // multi: 'correct' is authoritative (1-based); drop stray 'answer'
   const raw = Array.isArray(incoming.correct) ? incoming.correct
             : Array.isArray(rows[idx].correct) ? rows[idx].correct
             : [];
   merged.correct = [...new Set(raw.filter(n => Number.isInteger(n) && n >= 1 && n <= optLen))].sort((a,b)=>a-b);
   merged.answer = null;
 } else {
   // single: 'answer' (0-based) is authoritative; reflect into 1-based 'correct'
   const ans = Number.isInteger(incoming.answer) ? incoming.answer
            : Number.isInteger(rows[idx].answer) ? rows[idx].answer
            : null;
   merged.answer = (Number.isInteger(ans) && ans >= 0 && ans < optLen) ? ans : null;
   merged.correct = Number.isInteger(merged.answer) ? [merged.answer + 1] : [];
 }

      rows[idx] = merged;

      const finalSummary = recomputeSummary(rows, summary);
      await writeParsed(mockTestId, rows, finalSummary);

      await patchMock(mockTestId, {
        totalQuestions: finalSummary.totalQuestions,
        totalMarks: finalSummary.totalMarks,
        sections: finalSummary.sections,
        sectionNames: finalSummary.sectionNames || [],
        updatedAt: new Date().toISOString(),
      });

      res.json({ ok: true, summary: finalSummary });
    } catch (e) {
      console.error("single update failed:", e);
      res.status(500).json({ error: "Failed to save question" });
    }
  }
);

/** POST insert one question (at optional index), return new index */
router.post(
  "/:mockTestId/questions",
  authAccess,
  requireRoles(["SuperAdmin", "Admin", "Teacher"]),
  async (req, res) => {
    try {
      const { mockTestId } = req.params;
      const { question = {}, at } = req.body || {};
      const { rows = [], summary = {} } = await readParsed(mockTestId);

      const insertAt = Number.isInteger(at) ? Math.min(Math.max(at, 0), rows.length) : rows.length;

      const q = {
        id: question.id || `q_${Date.now()}`,
        instruction: question.instruction || "",
        question: question.question || "",
        questionType: question.questionType || "Single_Choice",
        options: Array.isArray(question.options) ? question.options : ["", "", "", ""],
        answer: Number.isInteger(question.answer) ? question.answer : null,
        explanation: question.explanation || "",
        tags: Array.isArray(question.tags) ? question.tags : [],
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
        sectionNames: finalSummary.sectionNames || [],
        updatedAt: new Date().toISOString(),
      });

      res.json({ ok: true, index: insertAt, summary: finalSummary });
    } catch (e) {
      console.error("create question failed:", e);
      res.status(500).json({ error: "Failed to add question" });
    }
  }
);

/** DELETE one question by index (persist, recompute, update header) */
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
        sectionNames: finalSummary.sectionNames || [],
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
