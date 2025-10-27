// EdzestiLMS/API/Route/API_Student/StudentModule/StudentMocktestRoute/explanation.js
const express = require("express");
const { ddb } = require("../../../../Services/aws/dynamo");

const router = express.Router();

/**
 * GET /api/student/mocktest/attempt/:attemptId/explanation
 * Returns { attemptId, testId, score, total, review[] }
 */
router.get("/attempt/:attemptId/explanation", async (req, res) => {
  try {
    const { attemptId } = req.params;

    const r = await ddb
      .get({
        TableName: process.env.DDB_STUDENT_TEST_DATA,
        Key: { attemptId },
        ProjectionExpression: "attemptId, testId, score, total, review",
      })
      .promise();

    if (!r.Item) return res.status(404).json({ message: "Attempt not found" });
    res.json(r.Item);
  } catch (err) {
    console.error("Explanation load failed:", err);
    res.status(500).json({ message: "Failed to load explanation" });
  }
});

module.exports = router;
