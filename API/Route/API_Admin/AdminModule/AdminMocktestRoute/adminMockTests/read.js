// --------------------------------------------------------------
// 📦 Imports and Setup
// --------------------------------------------------------------
const express = require("express");
const { ddb } = require("../../../../../Services/aws/dynamo");
const { getById, getBySlug } = require("./repo");
const { authAccess, requireRoles } = require("../../../../../middleware/auth");
const { s3 } = require("../../../../../Services/aws/s3");

const MOCKTESTS_TABLE = process.env.MOCKTESTS_TABLE || "MockTests";

function mustHaveBucket() {
  if (!process.env.S3_BUCKET) {
    const err = new Error("S3_BUCKET env not set");
    err.status = 500;
    throw err;
  }
}

const router = express.Router();

// 🔧 Helper: read parsed.json for a mock test
async function getParsed(mockTestId) {
  mustHaveBucket();
  const Key = `mocktests/${mockTestId}/parsed.json`;
  const r = await s3.getObject({ Bucket: process.env.S3_BUCKET, Key }).promise();
  return JSON.parse(r.Body.toString("utf-8")); // { rows, summary }
}

/**
 * ============================================================
 * 📌 GET /api/admin/mocktests/:mockTestId
 * ------------------------------------------------------------
 * Fetch a mock test (header) by ID
 * ============================================================
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

/**
 * 📌 GET /api/admin/mocktests/by-slug/:slug
 * Fetch a mock test by its unique slug
 */
router.get(
  "/by-slug/:slug",
  authAccess,
  requireRoles(["SuperAdmin", "Admin", "Teacher"]),
  async (req, res) => {
    try {
      const slug = String(req.params.slug || "").trim().toLowerCase();
      if (!slug) return res.status(400).json({ error: "slug is required" });
      const item = await getBySlug(slug);
      if (!item) return res.status(404).json({ error: "Not found" });
      res.json(item);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

/**
 * 📌 GET /api/admin/mocktests/:mockTestId/questions/outline
 * Return a lightweight outline (index/id/title/options) for the sidebar.
 */
router.get(
  "/:mockTestId/questions/outline",
  authAccess,
  requireRoles(["SuperAdmin", "Admin", "Teacher"]),
  async (req, res) => {
    try {
      const { mockTestId } = req.params;
      const { rows = [], summary = {} } = await getParsed(mockTestId);

      const outline = rows.map((q, i) => ({
        i,
        id: q.id || `q_${i + 1}`,
        // Prefer canonical 'question' from the new parser; fall back to older aliases if present
        title: String(q.question || q.questionText || q.text || "").slice(0, 140),
        options: Array.isArray(q.options) ? q.options.slice(0, 4) : [],
      }));

      res.json({ outline, total: rows.length, summary });
    } catch (e) {
      if (e && (e.code === "NoSuchKey" || e.code === "NotFound")) {
        return res.json({ outline: [], total: 0, summary: {} });
      }
      res.status(e?.status || 500).json({ error: e?.message || "failed" });
    }
  }
);

/**
 * 📌 GET /api/admin/mocktests/:mockTestId/questions/:index
 * Return a single question by index + meta (index/total/summary).
 */
router.get(
  "/:mockTestId/questions/:index",
  authAccess,
  requireRoles(["SuperAdmin", "Admin", "Teacher"]),
  async (req, res) => {
    try {
      const { mockTestId, index } = req.params;
      const idx = Number(index);
      const { rows = [], summary = {} } = await getParsed(mockTestId);

      if (!Number.isInteger(idx) || idx < 0 || idx >= rows.length) {
        return res.status(404).json({ error: "Question index out of range" });
      }

      res.json({
        index: idx,
        total: rows.length,
        summary,
        question: rows[idx], // contains question, options, answer, section, difficulty, marks, etc.
      });
    } catch (e) {
      if (e && (e.code === "NoSuchKey" || e.code === "NotFound")) {
        return res.status(404).json({ error: "Questions not found" });
      }
      res.status(500).json({ error: "Failed to load question" });
    }
  }
);

/**
 * 📌 GET /api/admin/mocktests/:mockTestId/questions
 * Return the full parsed payload { rows, summary } from S3.
 */
router.get(
  "/:mockTestId/questions",
  authAccess,
  requireRoles(["SuperAdmin", "Admin", "Teacher"]),
  async (req, res) => {
    try {
      const { mockTestId } = req.params;
      const data = await getParsed(mockTestId); // reuse helper
      res.json(data);
    } catch (e) {
      console.error("fetch questions error:", e);
      if (e && (e.code === "NoSuchKey" || e.code === "NotFound")) {
        return res.status(404).json({ error: "Questions not found" });
      }
      res.status(500).json({ error: "Failed to load questions" });
    }
  }
);

/**
 * 📌 GET /api/admin/mocktests
 * Optional filters: instituteId
 * (Query GSI when instituteId provided, otherwise scan with a reasonable cap)
 */
router.get(
  "/",
  authAccess,
  requireRoles(["SuperAdmin", "Admin", "Teacher"]),
  async (req, res) => {
    try {
      const { instituteId } = req.query;

      let result;
      if (instituteId) {
        result = await ddb
          .query({
            TableName: MOCKTESTS_TABLE,
            IndexName: "GSI_Institute",
            KeyConditionExpression: "instituteId = :i",
            ExpressionAttributeValues: { ":i": instituteId },
          })
          .promise();
      } else {
        result = await ddb.scan({ TableName: MOCKTESTS_TABLE, Limit: 200 }).promise();
      }

      res.json(result.Items || []);
    } catch (e) {
      console.error("Fetch error:", e);
      res.status(500).json({ error: e.message });
    }
  }
);

module.exports = router;
