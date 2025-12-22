// EdzestiLMS/API/Route/API_Student/StudentModule/StudentMocktestRoute/explanation.js

const express = require("express");
// Import global DynamoDB DocumentClient wrapper (v3 under the hood)
const { ddb } = require("../../../../Services/aws/dynamo");

const router = express.Router();

/**
 * ============================================================
 * GET /api/student/mocktest/attempt/:attemptId/explanation
 * ------------------------------------------------------------
 * Purpose:
 *   → Fetch the summary & explanation of a completed mocktest attempt.
 *   → The response contains: attemptId, testId, score, total marks, and review[]
 *
 * review[] typically contains:
 *   - qIndex
 *   - userAnswer
 *   - correctAnswer
 *   - status (correct/wrong/skipped)
 *   - explanation text
 *   - other metadata
 *
 * This is normally used on the *Review / Explanation Page* for students.
 * ============================================================
 */

router.get("/attempt/:attemptId/explanation", async (req, res) => {
  try {
    // Extract attemptId from the URL
    const { attemptId } = req.params;

    // Fetch the record from the Dynamo table
    const r = await ddb
      .get({
        TableName: process.env.DDB_STUDENT_TEST_DATA, // table storing attempt result summary
        Key: { attemptId },                           // primary key
        // We only fetch specific fields to reduce payload
        ProjectionExpression: "attemptId, testId, score, total, review",
      })
      .promise();

    // If no such attempt exists → Not Found
    if (!r.Item) return res.status(404).json({ message: "Attempt not found" });

    // Return the summary/explanation object directly
    res.json(r.Item);
  } catch (err) {
    // Log server-side error
    console.error("Explanation load failed:", err);

    // Return sanitized error message
    res.status(500).json({ message: "Failed to load explanation" });
  }
});

module.exports = router;
