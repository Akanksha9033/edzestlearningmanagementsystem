// // API/Route/API_Student/StudentModule/StudentMocktestRoute/solutions.js
// const express = require("express");
// const router = express.Router();

// // ✅ Use global AWS v3 Dynamo wrapper (v2-like .promise() API)
// const { ddb: dynamo } = require("../../../../Services/aws/dynamo");

// // Middleware — User must be logged in AND must have valid roles
// const { authAccess, requireRoles } = require("../../../../middleware/auth");
// router.use(authAccess);     // ensures req.user exists
// router.use(requireRoles()); // ensures user has necessary roles (Student)

// // Dynamo table references
// const ATTEMPTS_TABLE = process.env.DDB_STU_ATTEMPTS || "StudentMocktestAttempts";
// const DATA_TABLE     = process.env.DDB_STU_DATA     || "StudentMocktestData";

// // Helper functions for loading questions & meta
// const { loadMockMeta, loadOneQuestion } = require("./MocktestShared/shared");

// /* -------------------------------- utils -------------------------------- */

// /** Compare student's answer and correct answer */
// function sameAnswer(user, correct) {
//   // Case 1: Multi-Choice: check array contents
//   if (Array.isArray(correct)) {
//     // Normalize both as sorted number arrays
//     const ua = Array.isArray(user) ? [...new Set(user)].map(Number).sort() : [];
//     const ca = [...new Set(correct)].map(Number).sort();

//     // lengths differ → incorrect
//     if (ua.length !== ca.length) return false;

//     // compare all values
//     for (let i = 0; i < ua.length; i++) if (ua[i] !== ca[i]) return false;
//     return true;
//   }

//   // Case 2: Single choice → compare as number
//   return Number(user) === Number(correct);
// }

// /** Determine which section a question belongs to using qIndex */
// function findSectionForIndex(absIndex, sections) {
//   if (!Array.isArray(sections) || sections.length === 0) return null;

//   for (let i = 0; i < sections.length; i++) {
//     const s = sections[i] || {};
//     const start = Number(s.start || 0); // absolute starting qIndex
//     const count = Number(s.count || 0); // number of questions in the section

//     // Check if qIndex falls inside this section’s range
//     if (count > 0 && absIndex >= start && absIndex < start + count) {
//       const noInSection = absIndex - start + 1; // 1-based index inside the section

//       return {
//         index: i,
//         name: String(s.name || `Section ${i + 1}`),
//         start,
//         count,
//         noInSection,
//       };
//     }
//   }
//   return null;
// }

// /**
//  * GET /api/student/attempts/:attemptId/solutions
//  * Returns: Full solution list for one completed attempt
//  */
// router.get("/attempts/:attemptId/solutions", async (req, res) => {
//   try {
//     const { attemptId } = req.params;
//     const sectionParam = req.query.section; // e.g. ?section=0

//     // ------------------------------------------------------------------
//     // 1) Validate attempt exists & belongs to logged-in student
//     // ------------------------------------------------------------------
//     const ar = await dynamo.get({
//       TableName: ATTEMPTS_TABLE,
//       Key: { attemptId, entity: "attempt" }, // PK + SK
//     }).promise();

//     const A = ar.Item;

//     if (!A) return res.status(404).json({ error: "Attempt not found" });

//     // Ensure student can only view their own attempt
//     if (A.userId && req.user && A.userId !== req.user.id)
//       return res.status(403).json({ error: "Forbidden" });

//     // Attempt must be submitted (not ongoing)
//     if (A.status !== "SUBMITTED")
//       return res.status(400).json({ error: "Attempt is not submitted yet" });

//     // ------------------------------------------------------------------
//     // 2) Fetch all question rows saved for this attempt
//     // ------------------------------------------------------------------
//     const qr = await dynamo.query({
//       TableName: DATA_TABLE,
//       KeyConditionExpression: "attemptId = :a", // fetch all data rows
//       ExpressionAttributeValues: { ":a": attemptId },
//     }).promise();

//     // ------------------------------------------------------------------
//     // 3) Load metadata (questions, structure, sections, etc.)
//     // ------------------------------------------------------------------
//     const meta = await loadMockMeta(A.mockTestId); // full mocktest JSON
//     const sections = Array.isArray(A.sections) ? A.sections : [];

//     // Sort saved answers in correct question order
//     let answers = (qr.Items || []).sort(
//       (a, b) => Number(a.qIndex || 0) - Number(b.qIndex || 0)
//     );

//     // Default scope → all questions
//     let scope = { type: "all" };

//     // ------------------------------------------------------------------
//     // Optional filter: view specific section only (?section=0 or ?section=1)
//     // ------------------------------------------------------------------
//     if (
//       A.useSections &&              // mock uses section-based layout
//       sections.length > 0 &&
//       sectionParam !== undefined &&
//       String(sectionParam).toLowerCase() !== "all"
//     ) {
//       const si = Number(sectionParam);

//       if (Number.isInteger(si) && si >= 0 && si < sections.length) {
//         const s = sections[si] || {};
//         const start = Number(s.start || 0); // abs start index
//         const count = Number(s.count || 0); // total questions in section
//         const end = count > 0 ? start + count - 1 : -1;

//         // Filter only questions belonging to selected section
//         if (count > 0) {
//           answers = answers.filter((row) => {
//             const idx = Number(row.qIndex || 0);
//             return idx >= start && idx <= end;
//           });

//           // Describe selected section in response
//           scope = {
//             type: "section",
//             sectionIndex: si,
//             sectionName: String(s.name || `Section ${si + 1}`),
//             sectionStart: start,
//             sectionTotal: count,
//           };
//         }
//       }
//     }

//     // ------------------------------------------------------------------
//     // 4) Build solution rows (loop through each question)
//     // ------------------------------------------------------------------
//     const out = [];

//     for (const row of answers) {
//       const absIndex = Number(row.qIndex || 0);

//       // Load that particular question's content from meta
//       // eslint-disable-next-line no-await-in-loop
//       const qdata = await loadOneQuestion(meta, absIndex);

//       // Extract useful information from qdata
//       const questionText = qdata?.questionText ?? qdata?.question ?? "";
//       const options = Array.isArray(qdata?.options) ? qdata.options : [];
//       const correct = qdata?.correct;
//       const explanation = qdata?.explanation ?? "";

//       // Student’s saved answer for this qIndex
//       const saved = row.saved || {};
//       const userAns = saved.answer;

//       // Determine correctness
//       let status = "skipped"; // default
//       if (
//         userAns !== undefined &&
//         userAns !== null &&
//         (!Array.isArray(userAns) || userAns.length > 0)
//       ) {
//         status = sameAnswer(userAns, correct) ? "correct" : "wrong";
//       }

//       // Determine section info for this question
//       const sec = findSectionForIndex(absIndex, sections);

//       // Push complete formatted object
//       out.push({
//         qIndex: absIndex,
//         questionText,
//         options,
//         correct,
//         userAnswer: userAns ?? null,
//         status,
//         explanation,
//         sectionIndex: sec ? sec.index : null,
//         sectionName: sec ? sec.name : null,
//         sectionNo: sec ? sec.noInSection : null,
//         sectionTotal: sec ? sec.count : null,
//       });
//     }

//     // ------------------------------------------------------------------
//     // Section summary (for sidebar / UI navigation)
//     // ------------------------------------------------------------------
//     const sectionSummaries = sections.map((s, i) => ({
//       index: i,
//       name: String(s.name || `Section ${i + 1}`),
//       start: Number(s.start || 0),
//       count: Number(s.count || 0),
//     }));

//     // ------------------------------------------------------------------
//     // Final response: all solutions, metadata, section info
//     // ------------------------------------------------------------------
//     res.json({
//       ok: true,
//       mockTestId: A.mockTestId,
//       total: out.length,      // number of returned questions
//       questions: out,         // full solution list
//       scope,                  // full or section-filtered
//       sections: sectionSummaries,
//     });
//   } catch (e) {
//     console.error("GET /attempts/:attemptId/solutions failed:", e);
//     res.status(500).json({ error: "Failed to load solutions" });
//   }
// });

// module.exports = router;


// API/Route/API_Student/StudentModule/StudentMocktestRoute/solutions.js
const express = require("express");
const router = express.Router();

// ✅ Use global AWS v3 Dynamo wrapper (v2-like .promise() API)
const { ddb: dynamo } = require("../../../../Services/aws/dynamo");

// Middleware — User must be logged in AND must have valid roles
const { authAccess, requireRoles } = require("../../../../middleware/auth");
router.use(authAccess);     // ensures req.user exists
router.use(requireRoles()); // ensures user has necessary roles (Student)

// Dynamo table references
const ATTEMPTS_TABLE = process.env.DDB_STU_ATTEMPTS || "StudentMocktestAttempts";
const DATA_TABLE     = process.env.DDB_STU_DATA     || "StudentMocktestData";

// Helper functions for loading questions & meta
const { loadMockMeta, loadOneQuestion } = require("./MocktestShared/shared");

/* -------------------------------- utils -------------------------------- */

/** Compare student's answer and correct answer */
function sameAnswer(user, correct) {
  // ✅ MULTIPLE CHOICE FIX
  if (Array.isArray(correct)) {
    const ua = Array.isArray(user)
      ? [...new Set(
          user.map((u) =>
            typeof u === "object" ? Number(u.optionIndex) : Number(u)
          )
        )].sort((a, b) => a - b)
      : [];

    // ✅ FIX: correct array normalize properly
    const ca = [...new Set(correct.map(Number))].sort((a, b) => a - b);

    if (ua.length !== ca.length) return false;

    for (let i = 0; i < ua.length; i++) {
      if (ua[i] !== ca[i]) return false;
    }
    return true;
  }

  // ✅ SINGLE CHOICE (UNCHANGED)
  return Number(user) === Number(correct);
}



/** Determine which section a question belongs to using qIndex */
function findSectionForIndex(absIndex, sections) {
  if (!Array.isArray(sections) || sections.length === 0) return null;

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i] || {};
    const start = Number(s.start || 0);
    const count = Number(s.count || 0);

    if (count > 0 && absIndex >= start && absIndex < start + count) {
      const noInSection = absIndex - start + 1;

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
 */
router.get("/attempts/:attemptId/solutions", async (req, res) => {
  try {
    const { attemptId } = req.params;
    const sectionParam = req.query.section;

    // 1) Load attempt
    const ar = await dynamo.get({
      TableName: ATTEMPTS_TABLE,
      Key: { attemptId, entity: "attempt" },
    }).promise();

    const A = ar.Item;
    if (!A) return res.status(404).json({ error: "Attempt not found" });

    if (A.userId && req.user && A.userId !== req.user.id)
      return res.status(403).json({ error: "Forbidden" });

    if (A.status !== "SUBMITTED")
      return res.status(400).json({ error: "Attempt is not submitted yet" });

    // 2) Load answers
    const qr = await dynamo.query({
      TableName: DATA_TABLE,
      KeyConditionExpression: "attemptId = :a",
      ExpressionAttributeValues: { ":a": attemptId },
    }).promise();

    // 3) Load mock meta
    const meta = await loadMockMeta(A.mockTestId);
    const sections = Array.isArray(A.sections) ? A.sections : [];

    let answers = (qr.Items || []).sort(
      (a, b) => Number(a.qIndex || 0) - Number(b.qIndex || 0)
    );

    let scope = { type: "all" };

    // Optional section filter
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

    // 4) Build solution output
    const out = [];

    for (const row of answers) {
      const absIndex = Number(row.qIndex || 0);
      const qdata = await loadOneQuestion(meta, absIndex);

      const questionText = qdata?.questionText ?? qdata?.question ?? "";
      const options = Array.isArray(qdata?.options) ? qdata.options : [];
      const correct = qdata?.correct;
      const explanation = qdata?.explanation ?? "";

      const saved = row.saved || {};
      const userAns = saved.answer;

      let status = "skipped";
      if (
        userAns !== undefined &&
        userAns !== null &&
        (!Array.isArray(userAns) || userAns.length > 0)
      ) {
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
        sectionIndex: sec ? sec.index : null,
        sectionName: sec ? sec.name : null,
        sectionNo: sec ? sec.noInSection : null,
        sectionTotal: sec ? sec.count : null,
      });
    }

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
