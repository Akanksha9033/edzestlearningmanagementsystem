
// Express module import (API routes banane ke liye)
const express = require("express");

// UUID import (unique sessionId / questionId generate karne ke liye)
const { v4: uuidv4 } = require("uuid");

// DynamoDB client import (database operations ke liye)
const { ddb } = require("../../../../Services/aws/dynamo");

// Express router create kar rahe hain (student-specific routes yahan define honge)
const router = express.Router();

const normalizeDifficulty = (v) => {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s) return "";
  if (s === "difficult" || s.startsWith("diff")) return "Hard";
  if (s === "hard") return "Hard";
  if (s.startsWith("easy")) return "Easy";
  if (s.startsWith("med")) return "Medium";
  return v;
};

const pickDate = (x) =>
  new Date(x?.endTime || x?.completedAt || x?.startTime || x?.createdAt || 0).getTime();

// ======================================================
// 📌 1️⃣ Get available filter options for a Question Bank
// ======================================================
// router.get("/:bankId/filters", async (req, res) => {
//   try {
//     const { bankId } = req.params;

//     // Us bank ke saare questions fetch kar rahe hain
//     const result = await ddb
//       .query({
//         TableName: process.env.DDB_QUESTIONS,
//         KeyConditionExpression: "bankId = :b",
//         ExpressionAttributeValues: { ":b": bankId },
//       })
//       .promise();

//     const questions = result.Items || [];

//     // Helpers
//     const uniq = (arr) =>
//       [...new Set(arr.map((v) => (typeof v === "string" ? v.trim() : v)).filter(Boolean))];

//     // ✅ tasks (prefer q.tasks; accept legacy q.tags)
//     const tasks = uniq(
//       questions.flatMap((q) => {
//         const collect = (v) => {
//           if (!v) return [];
//           if (Array.isArray(v)) return v;
//           if (typeof v === "string") return v.split(",").map((s) => s.trim());
//           return [];
//         };
//         return [...collect(q.tasks), ...collect(q.tags)];
//       })
//     );

//     // Question Type
//     const questionType = uniq(questions.map((q) => q.questionType));

//     // Difficulty (normalized)
//     const difficulty = uniq(
//       questions.map((q) => normalizeDifficulty(q.difficulty)).filter(Boolean)
//     );

//     // performanceDomain list
//     const performanceDomain = uniq(
//       questions.flatMap((q) => {
//         const v = q.performanceDomain;
//         if (!v) return [];
//         if (Array.isArray(v)) return v;
//         if (typeof v === "string") return v.split(",").map((s) => s.trim());
//         return [];
//       })
//     );

//     // approach list
//     const approach = uniq(
//       questions.flatMap((q) => {
//         const v = q.approach;
//         if (!v) return [];
//         if (Array.isArray(v)) return v;
//         if (typeof v === "string") return v.split(",").map((s) => s.trim());
//         return [];
//       })
//     );

//     // exam list
//     const exam = uniq(
//       questions.flatMap((q) => {
//         const v = q.exam;
//         if (!v) return [];
//         if (Array.isArray(v)) return v;
//         if (typeof v === "string") return v.split(",").map((s) => s.trim());
//         return [];
//       })
//     );

//     // ✅ Return tasks (canonical) and tags: tasks (mirror for legacy)
//     return res.json({
//       tasks,               // new canonical
//       tags: tasks,         // mirror for legacy clients
//       difficulty,
//       questionType,
//       performanceDomain,
//       approach,
//       exam,
//     });
//   } catch (err) {
//     console.error("❌ filters error", err);
//     return res.status(500).json({ error: "Failed to load filters" });
//   }
// });

router.get("/:bankId/filters", async (req, res) => {
  try {
    const { bankId } = req.params;

    const result = await ddb
      .query({
        TableName: process.env.DDB_QUESTIONS,
        KeyConditionExpression: "bankId = :b",
        ExpressionAttributeValues: { ":b": bankId },
      })
      .promise();

    const questions = result.Items || [];

    const uniq = (arr) =>
      [...new Set(arr.map((v) => (typeof v === "string" ? v.trim() : v)).filter(Boolean))];

    // collect tasks/tags from all questions
    let rawTasks = uniq(
      questions.flatMap((q) => {
        const collect = (v) => {
          if (!v) return [];
          if (Array.isArray(v)) return v;
          if (typeof v === "string") return v.split(",").map((s) => s.trim());
          return [];
        };
        return [...collect(q.tasks), ...collect(q.tags)];
      })
    );

    // 🔥 NEW: sort rawTasks by numeric prefix "1.1 –", "2.5 –", etc.
    const taskSortKey = (str) => {
      // str like "2.5 – Plan and Manage Budget ..."
      if (typeof str !== "string") return { major: 999, minor: 999 };

      // grab the "2.5" before the dash
      const match = str.trim().match(/^(\d+)\.(\d+)/);
      if (!match) return { major: 999, minor: 999 }; // unknowns go to bottom

      return {
        major: parseInt(match[1], 10),
        minor: parseInt(match[2], 10),
      };
    };

    rawTasks = rawTasks.sort((a, b) => {
      const A = taskSortKey(a);
      const B = taskSortKey(b);
      if (A.major !== B.major) return A.major - B.major;
      return A.minor - B.minor;
    });

    // other filter lists (unchanged)
    const questionType = uniq(questions.map((q) => q.questionType));

    const difficulty = uniq(
      questions.map((q) => {
        const s = String(q.difficulty ?? "").trim().toLowerCase();
        if (!s) return "";
        if (s === "difficult" || s.startsWith("diff")) return "Hard";
        if (s === "hard") return "Hard";
        if (s.startsWith("easy")) return "Easy";
        if (s.startsWith("med")) return "Medium";
        return q.difficulty;
      }).filter(Boolean)
    );

    const performanceDomain = uniq(
      questions.flatMap((q) => {
        const v = q.performanceDomain;
        if (!v) return [];
        if (Array.isArray(v)) return v;
        if (typeof v === "string") return v.split(",").map((s) => s.trim());
        return [];
      })
    );

    const approach = uniq(
      questions.flatMap((q) => {
        const v = q.approach;
        if (!v) return [];
        if (Array.isArray(v)) return v;
        if (typeof v === "string") return v.split(",").map((s) => s.trim());
        return [];
      })
    );

    const exam = uniq(
      questions.flatMap((q) => {
        const v = q.exam;
        if (!v) return [];
        if (Array.isArray(v)) return v;
        if (typeof v === "string") return v.split(",").map((s) => s.trim());
        return [];
      })
    );

    // ✅ send sorted tasks
    return res.json({
      tasks: rawTasks,      // canonical sorted list
      tags: rawTasks,       // mirror for legacy
      difficulty,
      questionType,
      performanceDomain,
      approach,
      exam,
    });
  } catch (err) {
    console.error("❌ filters error", err);
    return res.status(500).json({ error: "Failed to load filters" });
  }
});


// ======================================================
// 📌 2️⃣ Create practice session with filters
// ======================================================
router.post("/:bankId/session/create", async (req, res) => {
  try {
    // URL se bankId nikal rahe hain
    const { bankId } = req.params;

    // Body se filters aur settings le rahe hain (tasks support + legacy tags)
    const {
      tasks,              // NEW
      tags,               // legacy
      difficulty,
      approach,
      exam,
      questionType,
      performanceDomain,
      duration,
      questionCount,
      studentId: studentIdFromBody,
    } = req.body;

    // Validation: all required (allow tasks OR tags)
    // if (
    //   !(tasks || tags) ||
    //   !difficulty ||
    //   !questionType ||
    //   !performanceDomain ||
    //   !duration ||
    //   !questionCount
    // ) {
    //   return res.status(400).json({ error: "All fields are required." });
    // }

    // ✅ Student ID: agar login user hai to req.user.sub, warna request body se ya fallback
    const studentId =
      req.user?.sub || studentIdFromBody || "anonymous-student";

    // Us bank ke saare questions fetch kar rahe hain
    const result = await ddb
      .query({
        TableName: process.env.DDB_QUESTIONS,
        KeyConditionExpression: "bankId = :b",
        ExpressionAttributeValues: { ":b": bankId },
      })
      .promise();

    // Questions array me daal rahe hain
    let questions = result.Items || [];

    // ✅ Task selection (prefer tasks; fallback to tags)
    const selectedTask = tasks || tags || "";

    // ✅ Filter by selected Task against q.tasks or q.tags (comma-safe)
    if (selectedTask) {
      questions = questions.filter((q) => {
        const collect = (v) => {
          if (!v) return [];
          if (Array.isArray(v)) return v.map((x) => String(x).trim());
          return String(v).split(",").map((s) => s.trim());
        };
        const set = new Set([...collect(q.tasks), ...collect(q.tags)]);
        return set.has(selectedTask);
      });
    }

    // Filters apply kar rahe hain (student ne jo select kiya)
    if (difficulty) {
      const want = normalizeDifficulty(difficulty);
      questions = questions.filter((q) => normalizeDifficulty(q.difficulty) === want);
    }
    if (questionType)
      questions = questions.filter((q) => q.questionType === questionType);
    if (performanceDomain)
      questions = questions.filter(
        (q) => q.performanceDomain === performanceDomain
      );
    // optional filters
    if (approach) questions = questions.filter((q) => q.approach === approach);
    if (exam) questions = questions.filter((q) => q.exam === exam);

    // Agar filter ke baad koi question nahi mila
    if (questions.length === 0) {
      return res
        .status(404)
        .json({ error: "No questions found for selected filters." });
    }

    // Student ne kitne questions mangaye (default 10)
    const requestedCount = parseInt(questionCount) || 10;

    // Agar available questions kam hain requested se
    if (questions.length < requestedCount) {
      return res.status(400).json({
        error: `Only ${questions.length} questions available for selected filters, but you requested ${requestedCount}. Please reduce the number.`,
      });
    }

    // Questions ko randomly shuffle kar rahe hain
    const shuffled = questions.sort(() => 0.5 - Math.random());

    // Required number ke questions select kar rahe hain
    const selected = shuffled.slice(0, requestedCount);

    // Start aur end time calculate kar rahe hain (duration minutes me)
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + (duration || 10) * 60000);

    // Unique session ID generate kar rahe hain
    const sessionId = uuidv4();

    // Session data DynamoDB me save kar rahe hain (table: DDB_SESSIONS)
    await ddb
      .put({
        TableName: process.env.DDB_SESSIONS, // sessions table
        Item: {
          sessionId,
          studentId,
          bankId,
          filters: {
            // ✅ store Task selection (and mirror tags for history/compat)
            tasks: selectedTask || null,
            tags:  selectedTask || null,

            difficulty,
            approach,          // stored for history
            exam,              // stored for history
            questionType,
            performanceDomain,
            duration,
            questionCount: requestedCount,
          },
          // Question IDs list store kar rahe hain
          questions: selected.map((q) => q.questionId),
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          completed: false, // session not completed yet
          score: 0, // initial score 0
        },
      })
      .promise();

    // Frontend ko response bhejna
    res.json({ sessionId, questions: selected, duration });
  } catch (err) {
    console.error("❌ Session create error", err);
    res.status(500).json({ error: "Session create failed" });
  }
});

// ======================================================
// 📌 3️⃣ Submit a practice session (calculate score + mark complete)
// ======================================================
router.post("/session/:id/submit", async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const { answers } = req.body;

    if (!answers || typeof answers !== "object") {
      return res.status(400).json({ error: "Answers are required." });
    }

    const sessionResult = await ddb
      .get({
        TableName: process.env.DDB_SESSIONS,
        Key: { sessionId },
      })
      .promise();

    const session = sessionResult.Item;
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const questionIds = session.questions || [];
    if (questionIds.length === 0) {
      return res.status(400).json({ error: "No questions in this session" });
    }

    let questions = [];
    for (let i = 0; i < questionIds.length; i += 100) {
      const batch = questionIds.slice(i, i + 100);
      const result = await ddb
        .batchGet({
          RequestItems: {
            [process.env.DDB_QUESTIONS]: {
              Keys: batch.map((qid) => ({
                bankId: session.bankId,
                questionId: qid,
              })),
            },
          },
        })
        .promise();
      questions = questions.concat(result.Responses[process.env.DDB_QUESTIONS]);
    }

    let score = 0;

    const detailedResults = questions.map((q) => {
      const submitted = answers[q.questionId]; // 
      const correct = q.correctAnswer; // 

      const normalize = (arr) =>
        (Array.isArray(arr) ? arr : [arr]).map((x) =>
          String(x).trim().toUpperCase()
        );

      const submittedArr = normalize(submitted);
      const correctArr = normalize(correct);

      const submittedSet = new Set(submittedArr);
      const correctSet = new Set(correctArr);

      const isCorrect =
        submittedSet.size === correctSet.size &&
        [...submittedSet].every((ans) => correctSet.has(ans));

      if (isCorrect) score += q.marks || 1;

      return { 
        questionId: q.questionId, 
        submitted, 
        correct, 
        isCorrect,
        // ---- added for explanation UI (safe, non-breaking) ----
        questionText: q.questionText,
        options: q.options || [],
        explanation: q.explanation || q.explaination || q.reason || null
        // ------------------------------------------------------
      };
    });

    const answerMap = {};
    Object.keys(answers).forEach((qid) => {
      const v = answers[qid];
      if (Array.isArray(v)) answerMap[qid] = v.map(x => String(x).trim()).join(",");
      else answerMap[qid] = String(v ?? "").trim();
    });

    await ddb.update({
      TableName: process.env.DDB_SESSIONS,
      Key: { sessionId },
      UpdateExpression: "set completed = :c, score = :s, endTime = :e, review = :r, answerMap = :am",
      ExpressionAttributeValues: {
        ":c": true,
        ":s": score,
        ":e": new Date().toISOString(),
        ":r": detailedResults,
        ":am": answerMap,
      },
    }).promise();

    res.json({
      message: "✅ Session submitted successfully",
      sessionId,
      score,
      total: questions.length,
      results: detailedResults,
    });
  } catch (err) {
    console.error("❌ Submit session error", err);
    res.status(500).json({ error: "Submit session failed" });
  }
});

// ======================================================
// 📌 4️⃣ Get all sessions of a student
// ======================================================
router.get("/sessions/my", async (req, res) => {
  try {
    const studentId = req.user?.sub;
    if (!studentId) {
      return res.status(401).json({ error: "Unauthorized: studentId missing" });
    }

    const result = await ddb
      .scan({
        TableName: process.env.DDB_SESSIONS,
        FilterExpression: "studentId = :s",
        ExpressionAttributeValues: { ":s": studentId },
      })
      .promise();

    const sessions = (result.Items || []).sort(
      (a, b) => new Date(b.startTime) - new Date(a.startTime)
    );

    res.json(sessions);
  } catch (err) {
    console.error("❌ Error fetching student sessions", err);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

// ======================================================
// 📊 5️⃣ Get all attempts history (for charts)
// ======================================================
router.get("/student/attempts/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    const result = await ddb
      .scan({
        TableName: process.env.DDB_SESSIONS,
        FilterExpression: "studentId = :sid",
        ExpressionAttributeValues: { ":sid": studentId },
      })
      .promise();

    const attempts = {};

    (result.Items || []).forEach((item) => {
      const bankId = item.bankId;

      if (!attempts[bankId]) {
        attempts[bankId] = {
          ...item,
          allAttempts: [],
        };
      }

      attempts[bankId].allAttempts.push({
        attemptDate: item.startTime,
        score: item.score || 0,
        total: item.filters?.questionCount || 0,
      });
    });

    Object.values(attempts).forEach((bank) => {
      bank.allAttempts.sort(
        (a, b) => new Date(a.attemptDate) - new Date(b.attemptDate)
      );
    });

    res.json({ success: true, attempts });
  } catch (err) {
    console.error("❌ Error fetching attempts:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ======================================================
   📘 List only published banks for students
====================================================== */
router.get("/banks", async (req, res) => {
  try {
    const result = await ddb
      .scan({
        TableName: process.env.DDB_BANKS,
        FilterExpression: "#status = :s",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":s": "PUBLISHED" },
      })
      .promise();

    const banks = (result.Items || []).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json(banks);
  } catch (err) {
    console.error("❌ Error fetching student banks", err);
    res.status(500).json({ error: "Failed to fetch banks" });
  }
});

router.get("/banks", async (req, res) => {
  try {
    const result = await ddb
      .scan({
        TableName: process.env.DDB_BANKS,
        FilterExpression: "#status = :s",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":s": "PUBLISHED" },
      })
      .promise();

    const banks = (result.Items || []).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json(banks);
  } catch (err) {
    console.error("❌ Error fetching published banks", err);
    res.status(500).json({ error: "Failed to fetch banks" });
  }
});

// ======================================================
// 📌 6️⃣ Latest Explanation for a bank (current student)
// ======================================================
router.get("/:bankId/latest-explanation", async (req, res) => {
  try {
    const { bankId } = req.params;

    const studentId = req.user?.sub || req.user?.id || req.auth?.userId || req.query?.studentId;
    if (!studentId) return res.status(400).json({ error: "studentId required" });

    const result = await ddb.scan({
      TableName: process.env.DDB_SESSIONS,
      FilterExpression: "studentId = :s and bankId = :b and completed = :c",
      ExpressionAttributeValues: { ":s": studentId, ":b": bankId, ":c": true },
    }).promise();

    const sessions = (result.Items || []);
    if (!sessions.length) return res.json({ attemptId: null, review: [] });

    sessions.sort((a, b) => pickDate(b) - pickDate(a));
    const latest = sessions[0];

    if (Array.isArray(latest.review) && latest.review.length) {
      return res.json({
        attemptId: latest.sessionId,
        review: latest.review,
      });
    }

    const selectionMap = latest.answerMap || {};
    const questionIds = latest.questions || [];
    if (!questionIds.length) return res.json({ attemptId: latest.sessionId, review: [] });

    let questions = [];
    for (let i = 0; i < questionIds.length; i += 100) {
      const batch = questionIds.slice(i, i + 100);
      const r = await ddb.batchGet({
        RequestItems: {
          [process.env.DDB_QUESTIONS]: {
            Keys: batch.map((qid) => ({ bankId, questionId: qid })),
          },
        },
      }).promise();
      questions = questions.concat(r.Responses[process.env.DDB_QUESTIONS] || []);
    }

    const review = questions.map((q) => {
      const correct = Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer;
      const selected = selectionMap[q.questionId] || null;
      return {
        questionId: q.questionId,
        questionText: q.questionText,
        options: q.options || [],
        selected,
        correct,
        explanation: q.explanation || q.explaination || q.reason || null,
      };
    });

    return res.json({ attemptId: latest.sessionId, review });
  } catch (err) {
    console.error("latest-explanation failed:", err);
    return res.status(500).json({ error: "Failed to fetch latest explanation" });
  }
});

// Router export kar rahe hain taaki server.js me use ho sake
module.exports = router;
