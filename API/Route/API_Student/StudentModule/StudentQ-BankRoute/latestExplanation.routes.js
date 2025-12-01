// API/Route/API_Student/StudentModule/StudentQ-BankRoute/latestExplanation.routes.js
const express = require("express");
const router = express.Router();

// Global DynamoDB DocumentClient wrapper (AWS SDK v3 under the hood)
const { ddb } = require("../../../../Services/aws/dynamo");

// These MUST be set in your environment (.env or Lambda)
const TABLE_QUESTIONS = process.env.DDB_QUESTIONS;          // Table where all QBank questions live
const TABLE_ATTEMPTS  = process.env.DDB_STUDENT_TESTDATA;   // Table where student attempts are stored
const GSI_USER        = process.env.GSI_USER_TEST_STATUS;   // Optional GSI: userId-index for fast lookup

/* ------------------------------------------------------------------
   Helper → pickDate()
   Picks the most reliable timestamp field from attempt object.
------------------------------------------------------------------ */
const pickDate = (x) =>
  new Date(
    x?.attemptDate || x?.endTime || x?.completedAt || x?.startTime || x?.createdAt || 0
  ).getTime();

/* ------------------------------------------------------------------
   Helper → normalizeReview(attempt)
   Attempts may store review in different shapes (older vs newer).
   This function normalizes it to a standard format.
------------------------------------------------------------------ */
const normalizeReview = (attempt) => {
  const review = attempt?.review || attempt?.answers || attempt?.items;
  if (!Array.isArray(review)) return null;

  // Convert each record into a unified model:
  return review.map((r) => ({
    questionId: r.questionId || r.qid || r.id,
    questionText: r.questionText,
    options: r.options,
    selected: r.selected ?? r.given ?? r.marked,
    correct: r.correct ?? r.answer,
    explanation: r.explanation,
  }));
};

/* ------------------------------------------------------------------
   Helper → buildReviewFromSelections()
   When attempt does NOT store full review/explanation,
   we rebuild it by **joining selections with question bank**.

   selectionMap = {
      questionId: selectedOption,
      q123: 2,
      q124: [1, 3],
      ...
   }
------------------------------------------------------------------ */
async function buildReviewFromSelections(bankId, selectionMap = {}) {
  // Fetch all questions of this QBank
  const qres = await ddb
    .query({
      TableName: TABLE_QUESTIONS,
      KeyConditionExpression: "bankId = :b",
      ExpressionAttributeValues: { ":b": bankId },
    })
    .promise();

  const questions = qres.Items || [];

  // Build normalized review for each question
  return questions.map((q) => {
    const qid = q.questionId || q.id;
    const sel = selectionMap[qid];

    // Correct answer may be array → pick first for backward compatibility
    const correct = Array.isArray(q.correctAnswer)
      ? q.correctAnswer[0]
      : q.correctAnswer;

    return {
      questionId: qid,
      questionText: q.questionText,
      options: q.options || [],
      selected: sel,
      correct,
      explanation: q.explanation || "",
    };
  });
}

/* ==================================================================
   MAIN ROUTE: GET latest explanation for a student's Q-Bank attempt
   ---------------------------------------------------------------
   Endpoint:
      GET /api/student/qbank/:bankId/latest-explanation

   Steps:
     1) Identify the student (from auth)
     2) Fetch all attempts for this student (via GSI or scan fallback)
     3) Filter attempts for this Q-Bank bankId
     4) Pick the *latest* attempt
     5) If review exists → return it
     6) Otherwise → attempt full get() and re-check
     7) Otherwise → rebuild review using selections + questions
================================================================== */
router.get("/:bankId/latest-explanation", async (req, res) => {
  try {
    const { bankId } = req.params;

    // Determine student ID from several possible auth flows
    const studentId =
      req.user?.sub || req.user?.id || req.auth?.userId || req.query?.studentId;

    if (!studentId) return res.status(400).json({ error: "studentId required" });

    /* --------------------------------------------------------------
       1) Fetch ALL attempts of this student (fast: GSI; slow: scan)
    -------------------------------------------------------------- */
    let items = [];

    if (GSI_USER) {
      // Ideal scenario: Query only user-specific rows
      const attRes = await ddb
        .query({
          TableName: TABLE_ATTEMPTS,
          IndexName: GSI_USER, 
          KeyConditionExpression: "#u = :uid",
          ExpressionAttributeNames: { "#u": "userId" },
          ExpressionAttributeValues: { ":uid": studentId },
        })
        .promise();

      items = attRes.Items || [];
    } else {
      // Fallback: full table scan (not recommended)
      const attRes = await ddb.scan({ TableName: TABLE_ATTEMPTS }).promise();
      items = (attRes.Items || []).filter((x) => x.userId === studentId);
    }

    /* --------------------------------------------------------------
       2) Filter attempts matching THIS bankId
    -------------------------------------------------------------- */
    const sameBank = items.filter((a) => (a.bankId || a.qbankId) === bankId);

    // No attempts found
    if (!sameBank.length) return res.json({ attemptId: null, review: [] });

    /* --------------------------------------------------------------
       3) Pick the latest attempt by date
    -------------------------------------------------------------- */
    sameBank.sort((a, b) => pickDate(b) - pickDate(a));
    const latest = sameBank[0];

    // Extract attemptId from multiple possible field names
    const attemptId =
      latest.attemptId ||
      latest.id ||
      latest._id ||
      latest.meta?.attemptId ||
      null;

    /* --------------------------------------------------------------
       4) If normalized review already exists → return
    -------------------------------------------------------------- */
    const normalized = normalizeReview(latest);
    if (normalized?.length) {
      return res.json({ attemptId, review: normalized });
    }

    /* --------------------------------------------------------------
       5) Try FULL GET by attemptId (sometimes DB record incomplete)
    -------------------------------------------------------------- */
    if (attemptId) {
      try {
        const getRes = await ddb
          .get({
            TableName: TABLE_ATTEMPTS,
            Key: { attemptId },
          })
          .promise();

        const full = getRes.Item || latest;

        // Try to normalize again from full record
        const norm2 = normalizeReview(full);
        if (norm2?.length) {
          return res.json({ attemptId, review: norm2 });
        }

        // No normalized review → build manually from selection maps
        const selMap =
          full.visitedAnswers ||
          full.selections ||
          full.answerMap ||
          full.selectedMap ||
          {};

        const built = await buildReviewFromSelections(bankId, selMap);
        return res.json({ attemptId, review: built });
      } catch (_) {
        // Ignore errors and fall back to last step
      }
    }

    /* --------------------------------------------------------------
       6) FINAL FALLBACK → No attemptId or no review, return empty-built review
    -------------------------------------------------------------- */
    const built = await buildReviewFromSelections(bankId, {});
    return res.json({ attemptId, review: built });

  } catch (err) {
    console.error("latest-explanation failed:", err);
    res.status(500).json({ error: "Failed to fetch latest explanation" });
  }
});

module.exports = router;
