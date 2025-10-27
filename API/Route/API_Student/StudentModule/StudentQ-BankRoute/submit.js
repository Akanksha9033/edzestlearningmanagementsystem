// EdzestiLMS/API/Route/API_Student/StudentModule/StudentMocktestRoute/submit.js
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { ddb } = require("../../../../Services/aws/dynamo");

const router = express.Router();

/**
 * POST /api/student/mocktest/submit
 * Body: { testId, userId, answers: [{questionId, selected}] }
 * Saves attempt, returns { attemptId, score, total }
 */
router.post("/submit", async (req, res) => {
  try {
    const { testId, userId, answers } = req.body || {};
    if (!testId || !Array.isArray(answers)) {
      return res.status(400).json({ message: "testId and answers required" });
    }

    // 1) Load questions for this test
    // If your table is grouped by bankId instead of testId, adjust this query accordingly.
    const qRes = await ddb
      .query({
        TableName: process.env.DDB_QUESTIONS,  // e.g., EdzestQuestions
        IndexName: "byTestId",                 // GSI: PK=testId, SK=questionId (or change to your pattern)
        KeyConditionExpression: "testId = :t",
        ExpressionAttributeValues: { ":t": testId },
      })
      .promise();

    const questions = qRes.Items || [];

    // 2) Score & build review payload
    const byQ = new Map(answers.map(a => [a.questionId, a.selected]));
    let score = 0;
    const review = questions.map((q) => {
      const correct = q.correctOption;       // 🔁 rename if your field differs
      const selected = byQ.get(q.questionId) || null;
      if (selected && selected === correct) score += 1;

      return {
        questionId: q.questionId,
        questionText: q.questionText,        // 🔁 rename if needed
        options: q.options,                   // { A, B, C, D } (rename if needed)
        selected,
        correct,
        explanation: q.explanation || "",     // 🔁 rename if needed
      };
    });

    // 3) Persist attempt (for later explanation view)
    const attemptId = uuidv4();
    await ddb
      .put({
        TableName: process.env.DDB_STUDENT_TEST_DATA, // e.g., StudentTestData
        Item: {
          attemptId,
          testId,
          userId,
          submittedAt: Date.now(),
          score,
          total: questions.length,
          review, // full explanation payload
        },
      })
      .promise();

    // 4) Return minimal result for “score on same page”
    res.json({ attemptId, testId, score, total: questions.length });
  } catch (err) {
    console.error("Submit failed:", err);
    res.status(500).json({ message: "Submit failed" });
  }
});

module.exports = router;
