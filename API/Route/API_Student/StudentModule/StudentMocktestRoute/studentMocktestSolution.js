// /* eslint-disable no-console */

// // API/Route/API_Student/StudentModule/StudentMocktestRoute/solutions.js
// const express = require("express");
// const router = express.Router();

// /* ---------------- AWS & Dynamo exactly like your existing routes ---------------- */
// const AWS = require("../../../../Services/aws/config");
// const { DocumentClient } = require("aws-sdk/clients/dynamodb");
// const dynamo = new DocumentClient({ service: new AWS.DynamoDB() });

// /* ---------------- Student auth (same middleware you use everywhere) ------------- */
// const { authAccess, requireRoles } = require("../../../../middleware/auth");
// router.use(authAccess);
// router.use(requireRoles());

// /* ---------------- Table names: match your env keys & defaults ------------------- */
// const ATTEMPTS_TABLE = process.env.DDB_STU_ATTEMPTS || "StudentMocktestAttempts";
// const DATA_TABLE     = process.env.DDB_STU_DATA     || "StudentMocktestData";

// /* --------- Question source: reuse your shared provider (S3/DDB aware) ----------- */
// const { loadMockMeta, loadOneQuestion } = require("./MocktestShared/shared");

// /* ------------------------------ utils ------------------------------------------ */
// function sameAnswer(user, correct) {
//   if (Array.isArray(correct)) {
//     const ua = Array.isArray(user) ? [...new Set(user)].map(Number).sort() : [];
//     const ca = [...new Set(correct)].map(Number).sort();
//     if (ua.length !== ca.length) return false;
//     for (let i = 0; i < ua.length; i++) if (ua[i] !== ca[i]) return false;
//     return true;
//   }
//   return Number(user) === Number(correct);
// }

// router.get("/attempts/:attemptId/solutions", async (req, res) => {
//   try {
//     const { attemptId } = req.params;

//     // 1) Attempt guard (same pattern as your other handlers)
//     const ar = await dynamo.get({
//       TableName: ATTEMPTS_TABLE,
//       Key: { attemptId, entity: "attempt" },
//     }).promise();

//     const A = ar.Item;
//     if (!A) return res.status(404).json({ error: "Attempt not found" });
//     if (A.userId && req.user && A.userId !== req.user.id) {
//       return res.status(403).json({ error: "Forbidden" });
//     }
//     if (A.status !== "SUBMITTED") {
//       return res.status(400).json({ error: "Attempt is not submitted yet" });
//     }

//     // 2) Fetch all saved rows for this attempt (your existing shape)
//     const qr = await dynamo.query({
//       TableName: DATA_TABLE,
//       KeyConditionExpression: "attemptId = :a",
//       ExpressionAttributeValues: { ":a": attemptId },
//     }).promise();

//     const answers = (qr.Items || []).sort(
//       (a, b) => Number(a.qIndex || 0) - Number(b.qIndex || 0)
//     );

//     // 3) Load source-of-truth questions via your shared provider
//     const meta = await loadMockMeta(A.mockTestId);

//     const out = [];
//     for (const row of answers) {
//       const absIndex = Number(row.qIndex || 0);
//       // eslint-disable-next-line no-await-in-loop
//       const qdata = await loadOneQuestion(meta, absIndex);

//       // Normalize across your JSON variants
//       const questionText = qdata?.questionText ?? qdata?.question ?? "";
//       const options = Array.isArray(qdata?.options) ? qdata.options : [];
//       const correct = qdata?.correct; // number | number[]
//       const explanation = qdata?.explanation ?? "";

//       const saved = row.saved || {};
//       const userAns = saved.answer; // number | number[] | null/undefined

//       let status = "skipped";
//       if (userAns === undefined || userAns === null || (Array.isArray(userAns) && userAns.length === 0)) {
//         status = "skipped";
//       } else {
//         status = sameAnswer(userAns, correct) ? "correct" : "wrong";
//       }

//       out.push({
//         qIndex: absIndex,
//         questionText,
//         options,
//         correct,
//         userAnswer: userAns,
//         status,
//         explanation,
//       });
//     }

//     res.json({ ok: true, mockTestId: A.mockTestId, total: out.length, questions: out });
//   } catch (e) {
//     console.error("GET /attempts/:attemptId/solutions failed:", e);
//     res.status(500).json({ error: "Failed to load solutions" });
//   }
// });

// module.exports = router;





/* eslint-disable no-console */

// API/Route/API_Student/StudentModule/StudentMocktestRoute/solutions.js
const express = require("express");
const router = express.Router();

const AWS = require("../../../../Services/aws/config");
const { DocumentClient } = require("aws-sdk/clients/dynamodb");
const dynamo = new DocumentClient({ service: new AWS.DynamoDB() });

const { authAccess, requireRoles } = require("../../../../middleware/auth");
router.use(authAccess);
router.use(requireRoles());

const ATTEMPTS_TABLE = process.env.DDB_STU_ATTEMPTS || "StudentMocktestAttempts";
const DATA_TABLE     = process.env.DDB_STU_DATA     || "StudentMocktestData";

const { loadMockMeta, loadOneQuestion } = require("./MocktestShared/shared");

/* -------------------------------- utils -------------------------------- */
function sameAnswer(user, correct) {
  if (Array.isArray(correct)) {
    const ua = Array.isArray(user) ? [...new Set(user)].map(Number).sort() : [];
    const ca = [...new Set(correct)].map(Number).sort();
    if (ua.length !== ca.length) return false;
    for (let i = 0; i < ua.length; i++) if (ua[i] !== ca[i]) return false;
    return true;
  }
  return Number(user) === Number(correct);
}

function findSectionForIndex(absIndex, sections) {
  if (!Array.isArray(sections) || sections.length === 0) return null;
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i] || {};
    const start = Number(s.start || 0);
    const count = Number(s.count || 0);
    if (count > 0 && absIndex >= start && absIndex < start + count) {
      const noInSection = absIndex - start + 1; // 1-based within section
      return {
        index: i,
        name: String(s.name || `Section ${i + 1}`),
        start,
        count,
        noInSection,
      };
    }
  }
  return null;
}

/**
 * GET /api/student/attempts/:attemptId/solutions
 * Optional query: ?section=0|1|...|all   (defaults to "all")
 * - Fast: answered-only (reads StudentMocktestData + per-question fetch for those rows only)
 * - Each question item includes section info: sectionIndex, sectionName, sectionNo, sectionTotal
 */
router.get("/attempts/:attemptId/solutions", async (req, res) => {
  try {
    const { attemptId } = req.params;
    const sectionParam = req.query.section; // e.g. "0" | "1" | "all" | undefined

    // 1) Attempt guard
    const ar = await dynamo.get({
      TableName: ATTEMPTS_TABLE,
      Key: { attemptId, entity: "attempt" },
    }).promise();

    const A = ar.Item;
    if (!A) return res.status(404).json({ error: "Attempt not found" });
    if (A.userId && req.user && A.userId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (A.status !== "SUBMITTED") {
      return res.status(400).json({ error: "Attempt is not submitted yet" });
    }

    // 2) Fetch saved rows (answered/visited)
    const qr = await dynamo.query({
      TableName: DATA_TABLE,
      KeyConditionExpression: "attemptId = :a",
      ExpressionAttributeValues: { ":a": attemptId },
    }).promise();

    // 3) Load meta & sections
    const meta = await loadMockMeta(A.mockTestId);
    const sections = Array.isArray(A.sections) ? A.sections : [];

    // If a numeric section is requested, filter rows to that section's window.
    let answers = (qr.Items || []).sort(
      (a, b) => Number(a.qIndex || 0) - Number(b.qIndex || 0)
    );

    let scope = { type: "all" };
    if (
      A.useSections &&
      sections.length > 0 &&
      sectionParam !== undefined &&
      String(sectionParam).toLowerCase() !== "all"
    ) {
      const si = Number(sectionParam);
      if (Number.isInteger(si) && si >= 0 && si < sections.length) {
        const s = sections[si] || {};
        const start = Number(s.start || 0);
        const count = Number(s.count || 0);
        const end = count > 0 ? start + count - 1 : -1;
        if (count > 0) {
          answers = answers.filter((row) => {
            const idx = Number(row.qIndex || 0);
            return idx >= start && idx <= end;
          });
          scope = {
            type: "section",
            sectionIndex: si,
            sectionName: String(s.name || `Section ${si + 1}`),
            sectionStart: start,
            sectionTotal: count,
          };
        }
      }
    }

    // 4) Build output (answered-only, but with section fields)
    const out = [];
    for (const row of answers) {
      const absIndex = Number(row.qIndex || 0);

      // eslint-disable-next-line no-await-in-loop
      const qdata = await loadOneQuestion(meta, absIndex);

      const questionText = qdata?.questionText ?? qdata?.question ?? "";
      const options = Array.isArray(qdata?.options) ? qdata.options : [];
      const correct = qdata?.correct; // number | number[]
      const explanation = qdata?.explanation ?? "";

      const saved = row.saved || {};
      const userAns = saved.answer;

      let status = "skipped";
      if (userAns !== undefined && userAns !== null && (!Array.isArray(userAns) || userAns.length > 0)) {
        status = sameAnswer(userAns, correct) ? "correct" : "wrong";
      }

      const sec = findSectionForIndex(absIndex, sections);
      out.push({
        qIndex: absIndex,
        questionText,
        options,
        correct,
        userAnswer: userAns ?? null,
        status,
        explanation,
        // --- section clarity ---
        sectionIndex: sec ? sec.index : null,
        sectionName:  sec ? sec.name  : null,
        sectionNo:    sec ? sec.noInSection : null,  // 1-based within section
        sectionTotal: sec ? sec.count : null,
      });
    }

    // Provide section summaries once for the client to label/filter if needed
    const sectionSummaries = sections.map((s, i) => ({
      index: i,
      name: String(s.name || `Section ${i + 1}`),
      start: Number(s.start || 0),
      count: Number(s.count || 0),
    }));

    res.json({
      ok: true,
      mockTestId: A.mockTestId,
      total: out.length,
      questions: out,
      scope,
      sections: sectionSummaries,
    });
  } catch (e) {
    console.error("GET /attempts/:attemptId/solutions failed:", e);
    res.status(500).json({ error: "Failed to load solutions" });
  }
});

module.exports = router;
