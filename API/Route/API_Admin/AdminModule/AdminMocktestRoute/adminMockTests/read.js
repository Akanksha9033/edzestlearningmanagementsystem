// --------------------------------------------------------------
// 📦 Imports and Setup
// --------------------------------------------------------------

// Express router setup
const express = require("express");

// DynamoDB v3 wrapper (DocumentClient)
const { ddb } = require("../../../../../Services/aws/dynamo");
const { QueryCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");

// Repo helpers to fetch mock tests from DB
const { getById, getBySlug } = require("./repo");

// Auth middlewares
const { authAccess, requireRoles } = require("../../../../../middleware/auth");

// AWS SDK v3 S3 client + GetObjectCommand
const { s3, GetObjectCommand } = require("../../../../../Services/aws/s3");

// DynamoDB table name (fallback to "MockTests")
const MOCKTESTS_TABLE = process.env.MOCKTESTS_TABLE || "MockTests";

// --------------------------------------------------------------
// Helper: Ensure bucket is configured
// --------------------------------------------------------------
function mustHaveBucket() {
  if (!process.env.S3_BUCKET) {
    const err = new Error("S3_BUCKET env not set"); // Custom error
    err.status = 500;
    throw err;
  }
}

const router = express.Router();

// --------------------------------------------------------------
// 🔧 Helper: Read parsed.json (SDK v3) for given mockTestId
// --------------------------------------------------------------
async function getParsed(mockTestId) {
  mustHaveBucket(); // Ensure bucket exists

  const Key = `mocktests/${mockTestId}/parsed.json`;

  // Fetch object from S3
  const res = await s3.send(
    new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key,
    })
  );

  // Read text from S3 stream
  const text = await res.Body.transformToString();

  return JSON.parse(text); // return { rows, summary }
}

// --------------------------------------------------------------
// 📌 GET: Get mock test by ID
// Route: /api/admin/mocktests/:mockTestId
// --------------------------------------------------------------
router.get(
  "/:mockTestId",
  authAccess,
  requireRoles(["SuperAdmin", "Admin", "Teacher"]),
  async (req, res) => {
    try {
      // Fetch from DynamoDB
      const item = await getById(req.params.mockTestId);

      if (!item) return res.status(404).json({ error: "Not found" });

      res.json(item);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

// --------------------------------------------------------------
// 📌 GET: Get mock test by slug
// Route: /api/admin/mocktests/by-slug/:slug
// --------------------------------------------------------------
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

// --------------------------------------------------------------
// 📌 GET: Outline of questions
// Route: /api/admin/mocktests/:mockTestId/questions/outline
// --------------------------------------------------------------
router.get(
  "/:mockTestId/questions/outline",
  authAccess,
  requireRoles(["SuperAdmin", "Admin", "Teacher"]),
  async (req, res) => {
    try {
      const { mockTestId } = req.params;

      // load parsed.json → rows + summary
      const { rows = [], summary = {} } = await getParsed(mockTestId);

      // Create a small outline preview for UI
      const outline = rows.map((q, i) => ({
        i, // index
        id: q.id || `q_${i + 1}`,
        title: String(q.question || q.questionText || q.text || "").slice(0, 140), // short preview
        options: Array.isArray(q.options) ? q.options.slice(0, 4) : [],
      }));

      res.json({ outline, total: rows.length, summary });
    } catch (e) {
      // If file not found → return empty safely
      if (e && (e.code === "NoSuchKey" || e.code === "NotFound")) {
        return res.json({ outline: [], total: 0, summary: {} });
      }
      res.status(e?.status || 500).json({ error: e?.message || "failed" });
    }
  }
);

// --------------------------------------------------------------
// 📌 GET: Single Question by index
// Route: /api/admin/mocktests/:mockTestId/questions/:index
// --------------------------------------------------------------
router.get(
  "/:mockTestId/questions/:index",
  authAccess,
  requireRoles(["SuperAdmin", "Admin", "Teacher"]),
  async (req, res) => {
    try {
      const { mockTestId, index } = req.params;
      const idx = Number(index);

      const { rows = [], summary = {} } = await getParsed(mockTestId);

      // Check if index is valid
      if (!Number.isInteger(idx) || idx < 0 || idx >= rows.length) {
        return res.status(404).json({ error: "Question index out of range" });
      }

      res.json({
        index: idx,
        total: rows.length,
        summary,
        question: rows[idx],
      });
    } catch (e) {
      if (e && (e.code === "NoSuchKey" || e.code === "NotFound")) {
        return res.status(404).json({ error: "Questions not found" });
      }
      res.status(500).json({ error: "Failed to load question" });
    }
  }
);

// --------------------------------------------------------------
// 📌 GET: All questions (raw parsed.json)
// Route: /api/admin/mocktests/:mockTestId/questions
// --------------------------------------------------------------
router.get(
  "/:mockTestId/questions",
  authAccess,
  requireRoles(["SuperAdmin", "Admin", "Teacher"]),
  async (req, res) => {
    try {
      const { mockTestId } = req.params;

      const data = await getParsed(mockTestId); // fetch full rows + summary

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

// --------------------------------------------------------------
// 📌 GET: List all mock tests (with optional filter)
// Route: /api/admin/mocktests?instituteId=xxx
// --------------------------------------------------------------
router.get(
  "/",
  authAccess,
  requireRoles(["SuperAdmin", "Admin", "Teacher"]),
  async (req, res) => {
    try {
      const { instituteId } = req.query;

      let result;

      if (instituteId) {
        // Use GSI_Institute index to fetch mock tests for specific institute
        result = await ddb
          .query({
            TableName: MOCKTESTS_TABLE,
            IndexName: "GSI_Institute",
            KeyConditionExpression: "instituteId = :i",
            ExpressionAttributeValues: { ":i": instituteId },
          })
          .promise();
      } else {
        // Full scan (limited to 200 items)
        result = await ddb
          .scan({
            TableName: MOCKTESTS_TABLE,
            Limit: 200,
          })
          .promise();
      }

      res.json(result.Items || []);
    } catch (e) {
      console.error("Fetch error:", e);
      res.status(500).json({ error: e.message });
    }
  }
);

module.exports = router;


// // --------------------------------------------------------------
// // 📦 Imports and Setup
// // --------------------------------------------------------------

// // Express router setup
// const express = require("express");

// // DynamoDB v3 wrapper (DocumentClient)
// const { ddb } = require("../../../../../Services/aws/dynamo");
// const { QueryCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");

// // Repo helpers to fetch mock tests from DB
// const { getById, getBySlug } = require("./repo");

// // Auth middlewares
// const { authAccess, requireRoles } = require("../../../../../middleware/auth");

// // AWS SDK v3 S3 client + GetObjectCommand
// const { s3, GetObjectCommand } = require("../../../../../Services/aws/s3");

// // DynamoDB table name (fallback to "MockTests")
// const MOCKTESTS_TABLE = process.env.MOCKTESTS_TABLE || "MockTests";

// // --------------------------------------------------------------
// // Helper: Ensure bucket is configured
// // --------------------------------------------------------------
// function mustHaveBucket() {
//   if (!process.env.S3_BUCKET) {
//     const err = new Error("S3_BUCKET env not set"); // Custom error
//     err.status = 500;
//     throw err;
//   }
// }

// const router = express.Router();

// // --------------------------------------------------------------
// // 🔧 Helper: Read parsed.json (SDK v3) for given mockTestId
// // --------------------------------------------------------------
// async function getParsed(mockTestId) {
//   // ✅ cache hit
//   if (PARSED_CACHE.has(mockTestId)) {
//     return PARSED_CACHE.get(mockTestId);
//   }

//   mustHaveBucket();

//   const Key = `mocktests/${mockTestId}/parsed.json`;

//   const res = await s3.send(
//     new GetObjectCommand({
//       Bucket: process.env.S3_BUCKET,
//       Key,
//     })
//   );

//   const text = await res.Body.transformToString();
//   const parsed = JSON.parse(text);

//   // 🔥 cache it
//   PARSED_CACHE.set(mockTestId, parsed);

//   return parsed;
// }


// // --------------------------------------------------------------
// // 📌 GET: Get mock test by ID
// // Route: /api/admin/mocktests/:mockTestId
// // --------------------------------------------------------------
// router.get(
//   "/:mockTestId",
//   authAccess,
//   requireRoles(["SuperAdmin", "Admin", "Teacher"]),
//   async (req, res) => {
//     try {
//       // Fetch from DynamoDB
//       const item = await getById(req.params.mockTestId);

//       if (!item) return res.status(404).json({ error: "Not found" });

//       res.json(item);
//     } catch (e) {
//       res.status(500).json({ error: e.message });
//     }
//   }
// );

// // --------------------------------------------------------------
// // 📌 GET: Get mock test by slug
// // Route: /api/admin/mocktests/by-slug/:slug
// // --------------------------------------------------------------
// router.get(
//   "/by-slug/:slug",
//   authAccess,
//   requireRoles(["SuperAdmin", "Admin", "Teacher"]),
//   async (req, res) => {
//     try {
//       const slug = String(req.params.slug || "").trim().toLowerCase();

//       if (!slug) return res.status(400).json({ error: "slug is required" });

//       const item = await getBySlug(slug);

//       if (!item) return res.status(404).json({ error: "Not found" });

//       res.json(item);
//     } catch (e) {
//       res.status(500).json({ error: e.message });
//     }
//   }
// );

// // --------------------------------------------------------------
// // 📌 GET: Outline of questions
// // Route: /api/admin/mocktests/:mockTestId/questions/outline
// // --------------------------------------------------------------
// router.get(
//   "/:mockTestId/questions/outline",
//   authAccess,
//   requireRoles(["SuperAdmin", "Admin", "Teacher"]),
//   async (req, res) => {
//     try {
//       const { mockTestId } = req.params;

//       // load parsed.json → rows + summary
//       const { rows = [], summary = {} } = await getParsed(mockTestId);

//       // Create a small outline preview for UI
//       const outline = rows.map((q, i) => ({
//         i, // index
//         id: q.id || `q_${i + 1}`,
//         title: String(q.question || q.questionText || q.text || "").slice(0, 140), // short preview
//         options: Array.isArray(q.options) ? q.options.slice(0, 4) : [],
//       }));

//       res.json({ outline, total: rows.length, summary });
//     } catch (e) {
//       // If file not found → return empty safely
//       if (e && (e.code === "NoSuchKey" || e.code === "NotFound")) {
//         return res.json({ outline: [], total: 0, summary: {} });
//       }
//       res.status(e?.status || 500).json({ error: e?.message || "failed" });
//     }
//   }
// );

// // --------------------------------------------------------------
// // 📌 GET: Single Question by index
// // Route: /api/admin/mocktests/:mockTestId/questions/:index
// // --------------------------------------------------------------
// router.get(
//   "/:mockTestId/questions/:index",
//   authAccess,
//   requireRoles(["SuperAdmin", "Admin", "Teacher"]),
//   async (req, res) => {
//     try {
//       const { mockTestId, index } = req.params;
//       const idx = Number(index);

//       const { rows = [], summary = {} } = await getParsed(mockTestId);

//       // Check if index is valid
//       if (!Number.isInteger(idx) || idx < 0 || idx >= rows.length) {
//         return res.status(404).json({ error: "Question index out of range" });
//       }

      

   
//     } catch (e) {
//       if (e && (e.code === "NoSuchKey" || e.code === "NotFound")) {
//         return res.status(404).json({ error: "Questions not found" });
//       }
//       res.status(500).json({ error: "Failed to load question" });
//     }
//   }
// );

// // --------------------------------------------------------------
// // 📌 GET: All questions (raw parsed.json)
// // Route: /api/admin/mocktests/:mockTestId/questions
// // --------------------------------------------------------------
// router.get(
//   "/:mockTestId/questions",
//   authAccess,
//   requireRoles(["SuperAdmin", "Admin", "Teacher"]),
//   async (req, res) => {
//     try {
//       const { mockTestId } = req.params;

//       const { rows = [], summary = {} } = await getParsed(mockTestId);

//       // 🔥 FIX: merge correct from meta.raw for ALL questions
//       const fixedRows = rows.map((q) => ({
//         ...q,
//         correct:
//           Array.isArray(q.correct) && q.correct.length
//             ? q.correct
//             : Array.isArray(q?.meta?.raw?.correct)
//             ? q.meta.raw.correct
//             : null,
//       }));

//       res.json({ rows: fixedRows, summary });
//     } catch (e) {
//       if (e && (e.code === "NoSuchKey" || e.code === "NotFound")) {
//         return res.status(404).json({ error: "Questions not found" });
//       }
//       res.status(500).json({ error: "Failed to load questions" });
//     }
//   }
// );


// // --------------------------------------------------------------
// // 📌 GET: List all mock tests (with optional filter)
// // Route: /api/admin/mocktests?instituteId=xxx
// // --------------------------------------------------------------
// router.get(
//   "/",
//   authAccess,
//   requireRoles(["SuperAdmin", "Admin", "Teacher"]),
//   async (req, res) => {
//     try {
//       const { instituteId } = req.query;

//       let result;

//       if (instituteId) {
//         // Use GSI_Institute index to fetch mock tests for specific institute
//         result = await ddb
//           .query({
//             TableName: MOCKTESTS_TABLE,
//             IndexName: "GSI_Institute",
//             KeyConditionExpression: "instituteId = :i",
//             ExpressionAttributeValues: { ":i": instituteId },
//           })
//           .promise();
//       } else {
//         // Full scan (limited to 200 items)
//         result = await ddb
//           .scan({
//             TableName: MOCKTESTS_TABLE,
//             Limit: 200,
//           })
//           .promise();
//       }

//       res.json(result.Items || []);
//     } catch (e) {
//       console.error("Fetch error:", e);
//       res.status(500).json({ error: e.message });
//     }
//   }
// );

// module.exports = router;

