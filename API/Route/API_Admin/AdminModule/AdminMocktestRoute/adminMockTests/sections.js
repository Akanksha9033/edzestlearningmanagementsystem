// routes/adminMockTests/sections.js
const express = require("express");
const { authAccess, requireRoles } = require("../../../../../middleware/auth");
const { readJsonFromS3 } = require("../../../../../Services/aws/s3Read");
const { getById } = require("./repo");

const router = express.Router();
const S3_BUCKET = process.env.S3_BUCKET;

router.get(
  "/:mockTestId/sections",
  authAccess,
  requireRoles(["SuperAdmin", "Admin", "Teacher"]),
  async (req, res) => {
    const { mockTestId } = req.params;
    const header = await getById(mockTestId);
    if (!header) return res.status(404).json({ error: "mock not found" });

    const parsed = await readJsonFromS3(S3_BUCKET, `mocktests/${mockTestId}/parsed.json`);
    const sections = parsed?.summary?.sections || header.sections || [];

    res.json({
      title: header.title,
      status: header.status,
      totalQuestions: header.totalQuestions,
      totalMarks: header.totalMarks,
      sections,
    });
  }
);

router.get(
  "/:mockTestId/sections/:sectionIndex/questions",
  authAccess,
  requireRoles(["SuperAdmin", "Admin", "Teacher"]),
  async (req, res) => {
    const { mockTestId, sectionIndex } = req.params;
    const offset = Math.max(0, parseInt(req.query.offset || "0", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "100", 10)));

    const parsed = await readJsonFromS3(S3_BUCKET, `mocktests/${mockTestId}/parsed.json`);
    const sections = parsed?.summary?.sections || [];
    const idx = parseInt(sectionIndex, 10);
    if (!Number.isInteger(idx) || idx < 0 || idx >= sections.length) {
      return res.status(400).json({ error: "invalid section index" });
    }

    const sec = sections[idx];
    const startZero = Math.max(0, (sec.startSerial || 1) - 1);
    const endZero = Math.max(startZero, (sec.endSerial || startZero) - 1);
    const slice = parsed.rows.slice(startZero, endZero + 1);
    const page = slice.slice(offset, offset + limit);

    res.json({
      section: { index: idx, name: sec.name, total: sec.count },
      total: slice.length,
      offset,
      limit,
      questions: page,
    });
  }
);

module.exports = router;
