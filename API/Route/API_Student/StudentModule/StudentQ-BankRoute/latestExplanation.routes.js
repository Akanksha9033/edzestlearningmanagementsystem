// API/Route/API_Student/StudentModule/StudentQ-BankRoute/latestExplanation.routes.js
const express = require("express");
const router = express.Router();
const { ddb } = require("../../../../Services/aws/dynamo");

// TODO: apne real table/env names set karo
const TABLE_QUESTIONS = process.env.DDB_QUESTIONS;          // PK: bankId, SK: questionId
const TABLE_ATTEMPTS  = process.env.DDB_STUDENT_TESTDATA;   // attempts table (where student attempts are stored)
const GSI_USER        = process.env.GSI_USER_TEST_STATUS;   // e.g., userId-index (optional but recommended)

// helpers ----------
const pickDate = (x) =>
  new Date(
    x?.attemptDate || x?.endTime || x?.completedAt || x?.startTime || x?.createdAt || 0
  ).getTime();

const normalizeReview = (attempt) => {
  const review = attempt?.review || attempt?.answers || attempt?.items;
  if (!Array.isArray(review)) return null;
  return review.map((r) => ({
    questionId: r.questionId || r.qid || r.id,
    questionText: r.questionText,
    options: r.options,
    selected: r.selected ?? r.given ?? r.marked,
    correct: r.correct ?? r.answer,
    explanation: r.explanation,
  }));
};

// If attempt stores only selections-map, join with questions to build explanation
async function buildReviewFromSelections(bankId, selectionMap = {}) {
  const qres = await ddb
    .query({
      TableName: TABLE_QUESTIONS,
      KeyConditionExpression: "bankId = :b",
      ExpressionAttributeValues: { ":b": bankId },
    })
    .promise();
  const questions = qres.Items || [];
  return questions.map((q) => {
    const qid = q.questionId || q.id;
    const sel = selectionMap[qid];
    const correct = Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer;
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

// MAIN: latest explanation for a bankId (of current student)
router.get("/:bankId/latest-explanation", async (req, res) => {
  try {
    const { bankId } = req.params;

    // student id — adjust per your auth
    const studentId =
      req.user?.sub || req.user?.id || req.auth?.userId || req.query?.studentId;
    if (!studentId) return res.status(400).json({ error: "studentId required" });

    // 1) get all attempts of this student (use your GSI if available)
    let items = [];
    if (GSI_USER) {
      const attRes = await ddb
        .query({
          TableName: TABLE_ATTEMPTS,
          IndexName: GSI_USER, // e.g., "userTestStatus"
          KeyConditionExpression: "#u = :uid",
          ExpressionAttributeNames: { "#u": "userId" },
          ExpressionAttributeValues: { ":uid": studentId },
        })
        .promise();
      items = attRes.Items || [];
    } else {
      // fallback: scan (not ideal; replace with your real query)
      const attRes = await ddb.scan({ TableName: TABLE_ATTEMPTS }).promise();
      items = (attRes.Items || []).filter((x) => x.userId === studentId);
    }

    // 2) filter this bank
    const sameBank = items.filter((a) => (a.bankId || a.qbankId) === bankId);
    if (!sameBank.length) return res.json({ attemptId: null, review: [] });

    // 3) pick newest
    sameBank.sort((a, b) => pickDate(b) - pickDate(a));
    const latest = sameBank[0];
    const attemptId =
      latest.attemptId || latest.id || latest._id || latest.meta?.attemptId || null;

    // 4) if review exist, return
    const normalized = normalizeReview(latest);
    if (normalized?.length) return res.json({ attemptId, review: normalized });

    // 5) try full attempt get (if your PK is attemptId)
    if (attemptId) {
      try {
        const getRes = await ddb
          .get({ TableName: TABLE_ATTEMPTS, Key: { attemptId } })
          .promise();
        const full = getRes.Item || latest;
        const norm2 = normalizeReview(full);
        if (norm2?.length) return res.json({ attemptId, review: norm2 });

        // build from selections map
        const selMap =
          full.visitedAnswers || full.selections || full.answerMap || full.selectedMap || {};
        const built = await buildReviewFromSelections(bankId, selMap);
        return res.json({ attemptId, review: built });
      } catch (_) {
        // ignore and fall back to builder using latest
      }
    }

    // last fallback
    const built = await buildReviewFromSelections(bankId, {});
    return res.json({ attemptId, review: built });
  } catch (err) {
    console.error("latest-explanation failed:", err);
    res.status(500).json({ error: "Failed to fetch latest explanation" });
  }
});

module.exports = router;
