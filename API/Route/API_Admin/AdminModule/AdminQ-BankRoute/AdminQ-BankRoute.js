const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { ddb } = require("../../../../Services/aws/dynamo");
const parseExcel = require("../../../../utils/q-bank_excelParser");

const router = express.Router();

/* ---------- Multer: in-memory (no folders on disk) ---------- */
const uploadMem = multer({ storage: multer.memoryStorage() });

/* ✅ Helper: legacy difficulty normalization (used in filters) */
const normalizeDifficulty = (v) => {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s) return "";
  if (s === "difficult" || s.startsWith("diff")) return "Hard";
  if (s === "hard") return "Hard";
  if (s.startsWith("easy")) return "Easy";
  if (s.startsWith("med")) return "Medium";
  return v;
};

/* ======================================================
   📌 Upload Excel → Create QuestionBank + Questions
   ✅ With Normalization + DRAFT Status
   ✅ No uploads folder; use /tmp just-in-time
====================================================== */
router.post("/upload", uploadMem.single("file"), async (req, res) => {
  try {
    const { name } = req.body;

    // ✅ basic validation
    if (!name || !req.file || !req.file.buffer) {
      return res.status(400).json({ error: "Bank name and Excel file required" });
    }

    // Write the in-memory file to a temp file under /tmp (Lambda-writable)
    const ext = path.extname(req.file.originalname || ".xlsx") || ".xlsx";
    const safeBase = path
      .basename(req.file.originalname || "upload", ext)
      .replace(/[^\w.-]/g, "_");

    const tmpPath = path.join(
      "/tmp",
      `qbank-${Date.now()}-${uuidv4()}-${safeBase}${ext}`
    );

    fs.writeFileSync(tmpPath, req.file.buffer);

    const bankId = uuidv4();

    // ✅ Save bank in DynamoDB with DRAFT status
    await ddb
      .put({
        TableName: process.env.DDB_BANKS,
        Item: {
          bankId,
          name,
          createdBy: req.user?.sub || "admin",
          createdAt: new Date().toISOString(),
          status: "DRAFT",
        },
      })
      .promise();

    // Parse from the temp file path (same logic you already had)
    const questions = await parseExcel(tmpPath);

    // ✅ delete temp file (safe)
    try { fs.unlinkSync(tmpPath); } catch {}

    // ✅ Normalization function (only difficulty/type mapping)
    const normalize = (val, type) => {
      if (!val) return "";
      const str = String(val).trim().toLowerCase();

      if (type === "difficulty") {
        if (str.startsWith("easy")) return "Easy";
        if (str.startsWith("med")) return "Medium";
        if (str.startsWith("diff")) return "Hard";
        if (str === "hard") return "Hard";
      }

      if (type === "questionType") {
        if (str.includes("single")) return "Single-Select";
        if (str.includes("multi")) return "Multi-Select";
        if (str.includes("blank")) return "Fill-in-the-Blank";
        if (str.includes("true")) return "True/False";
      }

      return String(val).trim();
    };

    // ✅ Normalize and batch insert questions
    const docs = questions.map((q) => ({
      PutRequest: {
        Item: {
          bankId,
          questionId: uuidv4(),
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          difficulty: normalize(q.difficulty, "difficulty"),
          questionType: normalize(q.questionType, "questionType"),
          tasks: q.tasks ? String(q.tasks).trim() : q.tags ? String(q.tags).trim() : "",
          tags: q.tags ? String(q.tags).trim() : q.tasks ? String(q.tasks).trim() : "",
          performanceDomain: q.performanceDomain ? String(q.performanceDomain).trim() : "",
          approach: q.approach ? String(q.approach).trim() : "",
          exam: q.exam ? String(q.exam).trim() : "",
          marks: q.marks || 1,
          explanation: q.explanation || "",
          createdAt: new Date().toISOString(),
        },
      },
    }));

    // DynamoDB batch write in chunks of 25
    if (docs.length > 0) {
      for (let i = 0; i < docs.length; i += 25) {
        const chunk = docs.slice(i, i + 25);
        await ddb
          .batchWrite({
            RequestItems: {
              [process.env.DDB_QUESTIONS]: chunk,
            },
          })
          .promise();
      }
    }

    res.json({ message: "✅ Bank uploaded successfully", bankId });
  } catch (err) {
    console.error("❌ Upload error", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

/* ======================================================
   📌 View all banks
====================================================== */
router.get("/", async (req, res) => {
  try {
    const result = await ddb.scan({ TableName: process.env.DDB_BANKS }).promise();

    const banks = (result.Items || []).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json(banks);
  } catch (err) {
    console.error("❌ Error fetching banks", err);
    res.status(500).json({ error: "Failed to fetch banks" });
  }
});

/*  🔵🔵🔵  ADDED: Get a single bank (used by Settings page)  🔵🔵🔵 */
router.get("/:bankId", async (req, res) => {
  try {
    const { bankId } = req.params;

    const result = await ddb
      .get({ TableName: process.env.DDB_BANKS, Key: { bankId } })
      .promise();

    if (!result.Item) {
      return res.status(404).json({ error: "Question Bank not found" });
    }

    return res.json(result.Item);
  } catch (err) {
    console.error("❌ Error fetching bank:", err);
    res.status(500).json({ error: "Failed to fetch bank" });
  }
});
/*  🔵🔵🔵  END ADDED  🔵🔵🔵 */

/* ======================================================
   📌 Get all questions of a bank (with optional filters)
====================================================== */
router.get("/:id/questions", async (req, res) => {
  try {
    const bankId = req.params.id;
    const { difficulty, questionType, tags, performanceDomain } = req.query;

    const result = await ddb
      .query({
        TableName: process.env.DDB_QUESTIONS,
        KeyConditionExpression: "bankId = :b",
        ExpressionAttributeValues: { ":b": bankId },
      })
      .promise();

    let questions = result.Items || [];

    // ✅ normalize incoming difficulty once
    const diffNorm = normalizeDifficulty(difficulty);

    // Apply filters (logic unchanged; only difficulty compare normalized)
    if (diffNorm) questions = questions.filter((q) => normalizeDifficulty(q.difficulty) === diffNorm);
    if (questionType) questions = questions.filter((q) => q.questionType === questionType);
    if (tags) questions = questions.filter((q) => q.tags === tags);
    if (performanceDomain) questions = questions.filter((q) => q.performanceDomain === performanceDomain);

    questions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    res.json(questions);
  } catch (err) {
    console.error("❌ Error fetching questions", err);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

/* ======================================================
   📌 Update a question
====================================================== */
router.put("/:bankId/questions/:questionId", async (req, res) => {
  try {
    const { bankId, questionId } = req.params;
    let updateData = req.body;

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No update fields provided" });
    }

    delete updateData.bankId;
    delete updateData.questionId;

    updateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, v]) => v !== undefined && v !== null)
    );

    const updateExpr =
      "set " +
      Object.keys(updateData)
        .map((k, i) => `#f${i} = :v${i}`)
        .join(", ");

    const exprAttrNames = Object.keys(updateData).reduce(
      (acc, k, i) => ({ ...acc, [`#f${i}`]: k }),
      {}
    );

    const exprAttrValues = Object.values(updateData).reduce(
      (acc, v, i) => ({ ...acc, [`:v${i}`]: v }),
      {}
    );

    await ddb
      .update({
        TableName: process.env.DDB_QUESTIONS,
        Key: { bankId, questionId },
        UpdateExpression: updateExpr,
        ExpressionAttributeNames: exprAttrNames,
        ExpressionAttributeValues: exprAttrValues,
      })
      .promise();

    res.json({ success: true, message: "✅ Question updated" });
  } catch (err) {
    console.error("❌ Error updating question:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/*  🔵🔵🔵  ADDED: Update bank meta (name/description/thumbnail)  🔵🔵🔵
   NOTE: still no uploads folder; we synthesize a filename to keep the same response shape
====================================================== */
router.put("/:bankId", uploadMem.single("thumbnail"), async (req, res) => {
  try {
    const { bankId } = req.params;
    const { name = "", description = "" } = req.body;

    let thumbnailUrl;
    if (req.file) {
      // Generate a stable "filename" even in memory mode (no real folder created).
      const ext = path.extname(req.file.originalname || "");
      const base = path
        .basename(req.file.originalname || "thumb", ext)
        .replace(/[^\w.-]/g, "_");
      const synthesized = `${Date.now()}-${base}${ext || ""}`;

      // Keep your existing response pattern exactly the same:
      thumbnailUrl = `/uploads/${synthesized}`;
      // (If you later want this to be real, upload req.file.buffer to S3 at the same key.)
    }

    const fields = { name, description };
    if (thumbnailUrl) fields.thumbnailUrl = thumbnailUrl;

    const clean = Object.fromEntries(
      Object.entries(fields).filter(([_, v]) => v !== undefined && v !== null)
    );

    if (Object.keys(clean).length === 0) {
      return res.status(400).json({ error: "No update fields provided" });
    }

    const updateExpr =
      "set " +
      Object.keys(clean)
        .map((k, i) => `#f${i} = :v${i}`)
        .join(", ");

    const exprAttrNames = Object.keys(clean).reduce(
      (acc, k, i) => ({ ...acc, [`#f${i}`]: k }),
      {}
    );

    const exprAttrValues = Object.values(clean).reduce(
      (acc, v, i) => ({ ...acc, [`:v${i}`]: v }),
      {}
    );

    await ddb
      .update({
        TableName: process.env.DDB_BANKS,
        Key: { bankId },
        UpdateExpression: updateExpr,
        ExpressionAttributeNames: exprAttrNames,
        ExpressionAttributeValues: exprAttrValues,
      })
      .promise();

    return res.json({ success: true, message: "✅ Question Bank updated" });
  } catch (err) {
    console.error("❌ Error updating bank:", err);
    res.status(500).json({ error: "Failed to update Question Bank" });
  }
});
/*  🔵🔵🔵  END ADDED  🔵🔵🔵 */

/* ======================================================
   📌 Delete a Question Bank (and its questions)
====================================================== */
router.delete("/:id", async (req, res) => {
  try {
    const bankId = req.params.id;

    // 1. Fetch all questions
    const result = await ddb
      .query({
        TableName: process.env.DDB_QUESTIONS,
        KeyConditionExpression: "bankId = :b",
        ExpressionAttributeValues: { ":b": bankId },
      })
      .promise();

    const questions = result.Items || [];

    // 2. Batch delete questions
    for (let i = 0; i < questions.length; i += 25) {
      const chunk = questions.slice(i, i + 25).map((q) => ({
        DeleteRequest: {
          Key: { bankId: q.bankId, questionId: q.questionId },
        },
      }));

      await ddb
        .batchWrite({
          RequestItems: { [process.env.DDB_QUESTIONS]: chunk },
        })
        .promise();
    }

    // 3. Delete the QuestionBank itself
    await ddb
      .delete({
        TableName: process.env.DDB_BANKS,
        Key: { bankId },
      })
      .promise();

    res.json({
      success: true,
      message: "✅ Question Bank deleted successfully",
    });
  } catch (err) {
    console.error("❌ Error deleting Question Bank:", err);
    res.status(500).json({ error: "Failed to delete Question Bank" });
  }
});

/* ======================================================
   📌 Publish a Question Bank (Set status = "PUBLISHED")
====================================================== */
router.put("/publish/:bankId", async (req, res) => {
  try {
    const { bankId } = req.params;

    await ddb
      .update({
        TableName: process.env.DDB_BANKS,
        Key: { bankId },
        UpdateExpression: "set #status = :s",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":s": "PUBLISHED" },
      })
      .promise();

    res.json({
      success: true,
      message: "✅ Question Bank published successfully",
    });
  } catch (err) {
    console.error("❌ Publish failed:", err);
    res.status(500).json({ error: "Failed to publish Question Bank" });
  }
});

/*  🔵🔵🔵  ADDED: Unpublish (optional)  🔵🔵🔵 */
router.put("/unpublish/:bankId", async (req, res) => {
  try {
    const { bankId } = req.params;

    await ddb
      .update({
        TableName: process.env.DDB_BANKS,
        Key: { bankId },
        UpdateExpression: "set #status = :s",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":s": "UNPUBLISHED" },
      })
      .promise();

    res.json({
      success: true,
      message: "✅ Question Bank unpublished successfully",
    });
  } catch (err) {
    console.error("❌ Unpublish failed:", err);
    res.status(500).json({ error: "Failed to unpublish Question Bank" });
  }
});
/*  🔵🔵🔵  END ADDED  🔵🔵🔵 */

module.exports = router;
