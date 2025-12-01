const express = require("express");
const { authAccess, requireRoles } = require("../../../../../middleware/auth");
// Helper that reads JSON from S3 (already v3 internally)
const { readJsonFromS3 } = require("../../../../../Services/aws/s3Read");
// Read mock test header (from DynamoDB)
const { getById } = require("./repo");

const router = express.Router();
//
// S3 bucket name from env
//
const S3_BUCKET = process.env.S3_BUCKET;

/* ============================================================================
   🟦 ROUTE 1
   GET /:mockTestId/sections
   → Returns mock test header + list of sections
   ----------------------------------------------------------------------------
   PURPOSE:
   - Fetches mock test "header" info from DynamoDB
   - Then tries reading parsed.json from S3
   - If parsed.json missing → uses header.sections (fallback)
   ============================================================================ */
router.get(
  "/:mockTestId/sections",
  authAccess,
  requireRoles(["SuperAdmin", "Admin", "Teacher"]),
  async (req, res) => {
    try {
      const { mockTestId } = req.params;

      // Get mock test metadata (header) from Dynamo
      const header = await getById(mockTestId);
      if (!header) return res.status(404).json({ error: "mock not found" });

      // Try reading parsed.json → may fail (fresh test / missing file)
      let parsed = null;
      try {
        parsed = await readJsonFromS3(
          S3_BUCKET,
          `mocktests/${mockTestId}/parsed.json`
        );
      } catch (err) {
        console.warn("parsed.json missing:", err.message);
      }

      // If parsed.json found → use its section summary
      // If missing → fallback to header.sections stored in DynamoDB
      const sections = parsed?.summary?.sections || header.sections || [];

      // Send back header info + section summary
      res.json({
        title: header.title,
        status: header.status,
        totalQuestions: header.totalQuestions,
        totalMarks: header.totalMarks,
        sections,
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

/* ============================================================================
   🟦 ROUTE 2
   GET /:mockTestId/sections/:sectionIndex/questions
   → Returns questions of a specific section (with pagination)
   ----------------------------------------------------------------------------
   PURPOSE:
   - Read parsed.json from S3
   - Find the correct section range (start → end)
   - Slice only those rows
   - Apply pagination (offset + limit)
   ============================================================================ */
router.get(
  "/:mockTestId/sections/:sectionIndex/questions",
  authAccess,
  requireRoles(["SuperAdmin", "Admin", "Teacher"]),
  async (req, res) => {
    try {
      const { mockTestId, sectionIndex } = req.params;

      // pagination controls: skip + limit
      const offset = Math.max(0, parseInt(req.query.offset || "0", 10));
      const limit = Math.min(
        100,
        Math.max(1, parseInt(req.query.limit || "100", 10))
      );

      // Read parsed.json safely
      let parsed = null;
      try {
        parsed = await readJsonFromS3(
          S3_BUCKET,
          `mocktests/${mockTestId}/parsed.json`
        );
      } catch (err) {
        return res.status(404).json({ error: "parsed.json not found" });
      }

      // Extract section ranges
      const sections = parsed?.summary?.sections || [];
      const idx = parseInt(sectionIndex, 10);

      // Validate section index
      if (!Number.isInteger(idx) || idx < 0 || idx >= sections.length) {
        return res.status(400).json({ error: "invalid section index" });
      }

      // Find selected section
      const sec = sections[idx];

      // Sections in summary use 1-based indexing → convert to 0-based
      const startZero = Math.max(0, (sec.startSerial || 1) - 1);
      const endZero = Math.max(startZero, (sec.endSerial || startZero) - 1);

      // Slice only questions belonging to this section
      const slice = parsed.rows.slice(startZero, endZero + 1);

      // Apply pagination
      const page = slice.slice(offset, offset + limit);

      // Return metadata + questions
      res.json({
        section: { index: idx, name: sec.name, total: sec.count },
        total: slice.length,
        offset,
        limit,
        questions: page,
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

module.exports = router;
