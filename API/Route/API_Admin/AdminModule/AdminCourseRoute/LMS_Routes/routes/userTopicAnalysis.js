// const express = require("express");
// const router = express.Router();
// const StudentTestData = require("../models/StudentTestData");
// const { verifyToken, verifyRole } = require("../middleware/auth");

// router.get("/analysis/weak-tags/:studentId", verifyToken, verifyRole(["Student"]), async (req, res) => {
//   try {
//     const studentId = req.params.studentId;

//     const { attemptId } = req.query;

//     let attempts = [];

//     if (attemptId) {
//       const singleAttempt = await StudentTestData.findById(attemptId);
//       if (!singleAttempt || singleAttempt.userId.toString() !== studentId) {
//         return res.status(404).json({ error: "Attempt not found for this user" });
//       }
//       attempts = [singleAttempt];
//     }  else {
//       // ✅ Fallback: only the latest completed attempt
//       const latestAttempt = await StudentTestData.findOne({
//         userId: studentId,
//         status: "completed"
//       }).sort({ completedAt: -1 });
//       if (!latestAttempt) {
//         return res.status(404).json({ error: "No completed attempts found" });
//       }

//       attempts = [latestAttempt];
//     }

//     const tagMap = {};

//     for (const attempt of attempts) {
//       const answers = Array.isArray(attempt.detailedAnswers) ? attempt.detailedAnswers : [];

//       for (const answer of answers) {
//         // const mainTag = answer.tags || "Unknown";
//         const mainTag = Array.isArray(answer.tags) ? answer.tags[0] || "Unknown" : (answer.tags || "Unknown");
//         const subtag = answer.subtag || "Unknown";
//         const approach = answer.approach || "Unknown";
//         const performanceDomain = answer.performanceDomain || "Unknown";
//         const difficulty = answer.difficulty || "Unknown";

//         if (!tagMap[mainTag]) {
//           tagMap[mainTag] = {
//             tag: mainTag,
//             total: 0,
//             correct: 0,
//             subtags: {}
//           };
//         }

//         tagMap[mainTag].total += 1;
//         if (answer.isCorrect) tagMap[mainTag].correct += 1;

//         if (!tagMap[mainTag].subtags[subtag]) {
//           tagMap[mainTag].subtags[subtag] = { approaches: {} };
//         }

//         if (!tagMap[mainTag].subtags[subtag].approaches[approach]) {
//           tagMap[mainTag].subtags[subtag].approaches[approach] = { domains: {} };
//         }

//         if (!tagMap[mainTag].subtags[subtag].approaches[approach].domains[performanceDomain]) {
//           tagMap[mainTag].subtags[subtag].approaches[approach].domains[performanceDomain] = { difficulties: {} };
//         }

//         if (!tagMap[mainTag].subtags[subtag].approaches[approach].domains[performanceDomain].difficulties[difficulty]) {
//           tagMap[mainTag].subtags[subtag].approaches[approach].domains[performanceDomain].difficulties[difficulty] = {
//             total: 0,
//             correct: 0
//           };
//         }

//         const stats = tagMap[mainTag].subtags[subtag].approaches[approach].domains[performanceDomain].difficulties[difficulty];
//         stats.total += 1;
//         if (answer.isCorrect) stats.correct += 1;
//       }
//     }

//     // Format result
//     const formatted = Object.values(tagMap).map(tag => ({
//       tag: tag.tag,
//       total: tag.total,
//       correct: tag.correct,
//       accuracy: tag.total > 0 ? +(tag.correct / tag.total * 100).toFixed(1) : 0,
//       subtags: Object.entries(tag.subtags).map(([subtagName, subtagData]) => ({
//         subtag: subtagName,
//         approaches: Object.entries(subtagData.approaches).map(([approachName, approachData]) => ({
//           approach: approachName,
//           domains: Object.entries(approachData.domains).map(([domainName, domainData]) => ({
//             performanceDomain: domainName,
//             difficulties: Object.entries(domainData.difficulties).map(([diffName, stats]) => ({
//               difficulty: diffName,
//               total: stats.total,
//               correct: stats.correct,
//               accuracy: stats.total > 0 ? +(stats.correct / stats.total * 100).toFixed(1) : 0
//             }))
//           }))
//         }))
//       }))
//     }));

//     res.json({ weakTags: formatted });

//   } catch (err) {
//     console.error("❌ Error in weak tag analysis:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// module.exports = router;



const express = require("express");
const router = express.Router();
// const StudentTestData = require("../models/StudentTestData");
const { authAccess, requireRoles } = require('../middleware/auth');

router.get("/analysis/weak-tags/:studentId", authAccess, requireRoles(["Student"]), async (req, res) => {
  try {
    const studentId = req.params.studentId;

    const { attemptId } = req.query;

    let attempts = [];

    if (attemptId) {
      const singleAttempt = await StudentTestData.findById(attemptId);
      if (!singleAttempt || singleAttempt.userId.toString() !== studentId) {
        return res.status(404).json({ error: "Attempt not found for this user" });
      }
      attempts = [singleAttempt];
    }  else {
      // ✅ Fallback: only the latest completed attempt
      const latestAttempt = await StudentTestData.findOne({
        userId: studentId,
        status: "completed"
      }).sort({ completedAt: -1 });
      if (!latestAttempt) {
        return res.status(404).json({ error: "No completed attempts found" });
      }

      attempts = [latestAttempt];
    }

    const tagMap = {};

    for (const attempt of attempts) {
      const answers = Array.isArray(attempt.detailedAnswers) ? attempt.detailedAnswers : [];

      for (const answer of answers) {
        // const mainTag = answer.tags || "Unknown";
        const mainTag = Array.isArray(answer.tags) ? answer.tags[0] || "Unknown" : (answer.tags || "Unknown");
        const subtag = answer.subtag || "Unknown";
        const approach = answer.approach || "Unknown";
        const performanceDomain = answer.performanceDomain || "Unknown";
        const difficulty = answer.difficulty || "Unknown";

        if (!tagMap[mainTag]) {
          tagMap[mainTag] = {
            tag: mainTag,
            total: 0,
            correct: 0,
            subtags: {}
          };
        }

        tagMap[mainTag].total += 1;
        if (answer.isCorrect) tagMap[mainTag].correct += 1;

        if (!tagMap[mainTag].subtags[subtag]) {
          tagMap[mainTag].subtags[subtag] = { approaches: {} };
        }

        if (!tagMap[mainTag].subtags[subtag].approaches[approach]) {
          tagMap[mainTag].subtags[subtag].approaches[approach] = { domains: {} };
        }

        if (!tagMap[mainTag].subtags[subtag].approaches[approach].domains[performanceDomain]) {
          tagMap[mainTag].subtags[subtag].approaches[approach].domains[performanceDomain] = { difficulties: {} };
        }

        if (!tagMap[mainTag].subtags[subtag].approaches[approach].domains[performanceDomain].difficulties[difficulty]) {
          tagMap[mainTag].subtags[subtag].approaches[approach].domains[performanceDomain].difficulties[difficulty] = {
            total: 0,
            correct: 0
          };
        }

        const stats = tagMap[mainTag].subtags[subtag].approaches[approach].domains[performanceDomain].difficulties[difficulty];
        stats.total += 1;
        if (answer.isCorrect) stats.correct += 1;
      }
    }

    // Format result
    const formatted = Object.values(tagMap).map(tag => ({
      tag: tag.tag,
      total: tag.total,
      correct: tag.correct,
      accuracy: tag.total > 0 ? +(tag.correct / tag.total * 100).toFixed(1) : 0,
      subtags: Object.entries(tag.subtags).map(([subtagName, subtagData]) => ({
        subtag: subtagName,
        approaches: Object.entries(subtagData.approaches).map(([approachName, approachData]) => ({
          approach: approachName,
          domains: Object.entries(approachData.domains).map(([domainName, domainData]) => ({
            performanceDomain: domainName,
            difficulties: Object.entries(domainData.difficulties).map(([diffName, stats]) => ({
              difficulty: diffName,
              total: stats.total,
              correct: stats.correct,
              accuracy: stats.total > 0 ? +(stats.correct / stats.total * 100).toFixed(1) : 0
            }))
          }))
        }))
      }))
    }));

    res.json({ weakTags: formatted });

  } catch (err) {
    console.error("❌ Error in weak tag analysis:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
