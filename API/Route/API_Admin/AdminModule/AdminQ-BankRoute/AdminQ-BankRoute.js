// const express = require("express"); 
// const multer = require("multer"); 
// const fs = require("fs");
// const path = require("path");
// const os = require("os");
// const { v4: uuidv4 } = require("uuid");
// const AWS = require("aws-sdk");
// const { ddb } = require("../../../../Services/aws/dynamo");
// const parseExcel = require("../../../../utils/q-bank_excelParser");

// /* ---------- AWS Setup ---------- */
// AWS.config.update({ region: process.env.AWS_REGION || "ap-south-1" });
// const s3 = new AWS.S3();

// /* ---------- Router ---------- */
// const router = express.Router();

// /* ---------- Multer: in-memory ---------- */
// const uploadMem = multer({ storage: multer.memoryStorage() });

// /* ---------- Env / Bucket setup ---------- */
// const S3_BUCKET = process.env.S3_PUBLIC_BUCKET || process.env.S3_BUCKET;
// console.log("[QBANK DEBUG] Using bucket:", S3_BUCKET);

// /* ---------- Difficulty Normalizer ---------- */
// const normalizeDifficulty = (v) => {
//   const s = String(v ?? "").trim().toLowerCase();
//   if (!s) return "";

//   if (s === "difficult" || s.startsWith("diff")) return "Hard";
//   if (s === "hard") return "Hard";
//   if (s.startsWith("easy")) return "Easy";
//   if (s.startsWith("med")) return "Medium";
//   return v;
// };

// /* ======================================================
//    ✅ Helper: Fetch ALL questions for a bank (handles pagination)
// ====================================================== */
// async function getAllQuestionsForBank(bankId) {
//   let items = [];
//   let lastKey = undefined;

//   do {
//     const result = await ddb
//       .query({
//         TableName: process.env.DDB_QUESTIONS,
//         KeyConditionExpression: "bankId = :b",
//         ExpressionAttributeValues: { ":b": bankId },
//         ExclusiveStartKey: lastKey,
//       })
//       .promise();

//     if (result.Items) items = items.concat(result.Items);
//     lastKey = result.LastEvaluatedKey;
//   } while (lastKey);

//   return items;
// }

// /* ============================================================
//    S3 Upload Helpers
// ============================================================ */

// async function uploadExcelBufferToS3({ bankId, fileObj }) {
//   if (!fileObj) return null;

//   try {
//     const extFromName = path.extname(fileObj.originalname || "").toLowerCase();
//     const finalExt = extFromName || ".xlsx";

//     const key = `qbanks/${bankId}/source${finalExt}`;

//     const contentTypeGuess =
//       fileObj.mimetype ||
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

//     if (!S3_BUCKET) {
//       console.warn("[QBank Upload] S3 bucket not set. Skipping upload.");
//       return null;
//     }

//     await s3
//       .putObject({
//         Bucket: S3_BUCKET,
//         Key: key,
//         Body: fileObj.buffer,
//         ContentType: contentTypeGuess,
//         ServerSideEncryption: process.env.S3_SSE || undefined,
//       })
//       .promise();

//     const cdnBase = process.env.CLOUDFRONT_PUBLIC_BASE;
//     if (cdnBase) return `https://${cdnBase}/${key}`;

//     return `https://${S3_BUCKET}.s3.amazonaws.com/${key}`;
//   } catch (err) {
//     console.error("[QBank Upload] Excel upload failed:", err);
//     return null;
//   }
// }

// async function uploadThumbnailBufferToS3({ bankId, fileObj }) {
//   if (!fileObj) return null;

//   try {
//     const extFromName = path.extname(fileObj.originalname || "").toLowerCase();
//     const finalExt = extFromName || ".png";

//     const key = `qbanks/${bankId}/cover${finalExt}`;

//     const contentTypeGuess =
//       fileObj.mimetype ||
//       (finalExt === ".png"
//         ? "image/png"
//         : finalExt === ".jpg" || finalExt === ".jpeg"
//         ? "image/jpeg"
//         : "application/octet-stream");

//     if (!S3_BUCKET) {
//       console.warn("[QBank Upload] S3 bucket not set.");
//       return null;
//     }

//     await s3
//       .putObject({
//         Bucket: S3_BUCKET,
//         Key: key,
//         Body: fileObj.buffer,
//         ContentType: contentTypeGuess,
//         ServerSideEncryption: process.env.S3_SSE || undefined,
//       })
//       .promise();

//     const cdnBase = process.env.CLOUDFRONT_PUBLIC_BASE;
//     if (cdnBase) return `https://${cdnBase}/${key}`;

//     return `https://${S3_BUCKET}.s3.amazonaws.com/${key}`;
//   } catch (err) {
//     console.error("[QBank Upload] Thumbnail upload failed:", err);
//     return null;
//   }
// }

// /* ======================================================
//    📌 Upload Excel + Thumbnail
// ====================================================== */
// router.post(
//   "/upload",
//   uploadMem.fields([
//     { name: "file", maxCount: 1 },
//     { name: "thumbnail", maxCount: 1 },
//   ]),
//   async (req, res) => {
//     try {
//       const { name } = req.body;

//       if (
//         !name ||
//         !req.files ||
//         !req.files.file ||
//         !req.files.file[0] ||
//         !req.files.file[0].buffer
//       ) {
//         return res.status(400).json({ error: "Bank name + Excel required" });
//       }

//       const excelFile = req.files.file[0];
//       const thumbFile =
//         req.files.thumbnail && req.files.thumbnail[0]
//           ? req.files.thumbnail[0]
//           : null;

//       const ext = path.extname(excelFile.originalname || ".xlsx") || ".xlsx";
//       const safeBase = path
//         .basename(excelFile.originalname || "upload", ext)
//         .replace(/[^\w.-]/g, "_");

//       const tmpPath = path.join(
//         os.tmpdir(),
//         `qbank-${Date.now()}-${uuidv4()}-${safeBase}${ext}`
//       );

//       fs.writeFileSync(tmpPath, excelFile.buffer);

//       const bankId = uuidv4();

//       const excelFileUrl = await uploadExcelBufferToS3({
//         bankId,
//         fileObj: excelFile,
//       });

//       const thumbnailUrl = await uploadThumbnailBufferToS3({
//         bankId,
//         fileObj: thumbFile,
//       });

//       const isPaid = req.body.isPaid === "true" || req.body.isPaid === true;
//       const pricePaise = Number(req.body.pricePaise) || 0;

//       const bankItem = {
//         bankId,
//         name,
//         createdBy: req.user?.sub || "admin",
//         createdAt: new Date().toISOString(),
//         status: "DRAFT",
//         isPaid,
//         pricePaise,
//       };

//       if (thumbnailUrl) bankItem.thumbnailUrl = thumbnailUrl;
//       if (excelFileUrl) bankItem.excelFileUrl = excelFileUrl;

//       await ddb
//         .put({
//           TableName: process.env.DDB_BANKS,
//           Item: bankItem,
//         })
//         .promise();

//       const questions = await parseExcel(tmpPath);

//       try {
//         fs.unlinkSync(tmpPath);
//       } catch (e) {}

//       const normalize = (val, type) => {
//         if (!val) return "";
//         const str = String(val).trim().toLowerCase();

//         if (type === "difficulty") {
//           if (str.startsWith("easy")) return "Easy";
//           if (str.startsWith("med")) return "Medium";
//           if (str.startsWith("diff") || str === "hard") return "Hard";
//         }

//         if (type === "questionType") {
//           if (str.includes("single")) return "Single-Select";
//           if (str.includes("multi")) return "Multi-Select";
//           if (str.includes("blank")) return "Fill-in-the-Blank";
//           if (str.includes("true")) return "True/False";
//         }

//         return String(val).trim();
//       };

//       const docs = questions.map((q) => ({
//         PutRequest: {
//           Item: {
//             bankId,
//             questionId: uuidv4(),
//             questionText: q.questionText,
//             options: q.options,
//             correctAnswer: q.correctAnswer,
//             difficulty: normalize(q.difficulty, "difficulty"),
//             questionType: normalize(q.questionType, "questionType"),
//             tasks: q.tasks
//               ? String(q.tasks).trim()
//               : q.tags
//               ? String(q.tags).trim()
//               : "",
//             tags: q.tags
//               ? String(q.tags).trim()
//               : q.tasks
//               ? String(q.tasks).trim()
//               : "",
//             performanceDomain: q.performanceDomain
//               ? String(q.performanceDomain).trim()
//               : "",
//             approach: q.approach ? String(q.approach).trim() : "",
//             exam: q.exam ? String(q.exam).trim() : "",
//             marks: q.marks || 1,
//             explanation: q.explanation || "",
//             createdAt: new Date().toISOString(),
//           },
//         },
//       }));

//       if (docs.length > 0) {
//         for (let i = 0; i < docs.length; i += 25) {
//           const chunk = docs.slice(i, i + 25);
//           await ddb
//             .batchWrite({
//               RequestItems: {
//                 [process.env.DDB_QUESTIONS]: chunk,
//               },
//             })
//             .promise();
//         }
//       }

//       return res.json({
//         message: "✅ Bank uploaded successfully",
//         bankId,
//         thumbnailUrl: thumbnailUrl || null,
//         excelFileUrl: excelFileUrl || null,
//         totalQuestions: questions.length,
//       });
//     } catch (err) {
//       console.error("❌ Upload error", err);
//       return res.status(500).json({ error: "Upload failed" });
//     }
//   }
// );

// /* ======================================================
//    📌 Get all banks
// ====================================================== */
// router.get("/", async (req, res) => {
//   try {
//     const result = await ddb.scan({ TableName: process.env.DDB_BANKS }).promise();

//     const banks = (result.Items || []).sort(
//       (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
//     );

//     res.json(
//       banks.map((b) => ({
//         ...b,
//         isPaid: !!b.isPaid,
//         pricePaise: Number(b.pricePaise) || 0,
//       }))
//     );
//   } catch (err) {
//     console.error("❌ Error fetching banks", err);
//     res.status(500).json({ error: "Failed to fetch banks" });
//   }
// });

// /* ======================================================
//    📌 Get single bank
// ====================================================== */
// router.get("/:bankId", async (req, res) => {
//   try {
//     const { bankId } = req.params;

//     const result = await ddb
//       .get({ TableName: process.env.DDB_BANKS, Key: { bankId } })
//       .promise();

//     if (!result.Item)
//       return res.status(404).json({ error: "Question Bank not found" });

//     return res.json(result.Item);
//   } catch (err) {
//     console.error("❌ Error fetching bank:", err);
//     res.status(500).json({ error: "Failed to fetch bank" });
//   }
// });

// /* ======================================================
//    📌 Get ALL questions of a bank (FIXED PAGINATION)
// ====================================================== */
// router.get("/:id/questions", async (req, res) => {
//   try {
//     const bankId = req.params.id;
//     const { difficulty, questionType, tags, performanceDomain } = req.query;

//     // 🔥 Fetch ALL questions (fix for missing 300+)
//     let questions = await getAllQuestionsForBank(bankId);

//     const diffNorm = normalizeDifficulty(difficulty);

//     // SAME FILTER LOGIC
//     if (diffNorm)
//       questions = questions.filter(
//         (q) => normalizeDifficulty(q.difficulty) === diffNorm
//       );
//     if (questionType)
//       questions = questions.filter((q) => q.questionType === questionType);
//     if (tags) questions = questions.filter((q) => q.tags === tags);
//     if (performanceDomain)
//       questions = questions.filter(
//         (q) => q.performanceDomain === performanceDomain
//       );

//     // SAME SORT LOGIC
//     questions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

//     return res.json(questions);
//   } catch (err) {
//     console.error("❌ Error fetching questions", err);
//     res.status(500).json({ error: "Failed to fetch questions" });
//   }
// });

// /* ======================================================
//    📌 Update question
// ====================================================== */
// router.put("/:bankId/questions/:questionId", async (req, res) => {
//   try {
//     const { bankId, questionId } = req.params;
//     let updateData = req.body;

//     if (!updateData || Object.keys(updateData).length === 0)
//       return res.status(400).json({ error: "No update fields provided" });

//     delete updateData.bankId;
//     delete updateData.questionId;

//     updateData = Object.fromEntries(
//       Object.entries(updateData).filter(
//         ([_, v]) => v !== undefined && v !== null
//       )
//     );

//     const updateExpr =
//       "set " +
//       Object.keys(updateData)
//         .map((k, i) => `#f${i} = :v${i}`)
//         .join(", ");

//     const exprAttrNames = Object.keys(updateData).reduce(
//       (acc, k, i) => ({ ...acc, [`#f${i}`]: k }),
//       {}
//     );

//     const exprAttrValues = Object.values(updateData).reduce(
//       (acc, v, i) => ({ ...acc, [`:v${i}`]: v }),
//       {}
//     );

//     await ddb
//       .update({
//         TableName: process.env.DDB_QUESTIONS,
//         Key: { bankId, questionId },
//         UpdateExpression: updateExpr,
//         ExpressionAttributeNames: exprAttrNames,
//         ExpressionAttributeValues: exprAttrValues,
//       })
//       .promise();

//     res.json({ success: true, message: "✅ Question updated" });
//   } catch (err) {
//     console.error("❌ Error updating question:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// /* ======================================================
//    📌 Update bank meta
// ====================================================== */
// router.put("/:bankId", uploadMem.single("thumbnail"), async (req, res) => {
//   try {
//     const { bankId } = req.params;
//     const { name = "", description = "" } = req.body;
//     const isPaid =
//       req.body.isPaid === "true" || req.body.isPaid === true;
//     const pricePaise = Number(req.body.pricePaise) || 0;

//     let thumbnailUrl;
//     if (req.file) {
//       const uploadedThumb = await uploadThumbnailBufferToS3({
//         bankId,
//         fileObj: req.file,
//       });

//       if (uploadedThumb) thumbnailUrl = uploadedThumb;
//     }

//     const fields = { name, description, isPaid, pricePaise };
//     if (thumbnailUrl) fields.thumbnailUrl = thumbnailUrl;

//     const clean = Object.fromEntries(
//       Object.entries(fields).filter(
//         ([_, v]) => v !== undefined && v !== null
//       )
//     );

//     if (Object.keys(clean).length === 0)
//       return res.status(400).json({ error: "No update fields provided" });

//     const updateExpr =
//       "set " +
//       Object.keys(clean)
//         .map((k, i) => `#f${i} = :v${i}`)
//         .join(", ");

//     const exprAttrNames = Object.keys(clean).reduce(
//       (acc, k, i) => ({ ...acc, [`#f${i}`]: k }),
//       {}
//     );

//     const exprAttrValues = Object.values(clean).reduce(
//       (acc, v, i) => ({ ...acc, [`:v${i}`]: v }),
//       {}
//     );

//     await ddb
//       .update({
//         TableName: process.env.DDB_BANKS,
//         Key: { bankId },
//         UpdateExpression: updateExpr,
//         ExpressionAttributeNames: exprAttrNames,
//         ExpressionAttributeValues: exprAttrValues,
//       })
//       .promise();

//     return res.json({
//       success: true,
//       message: "✅ Question Bank updated",
//     });
//   } catch (err) {
//     console.error("❌ Error updating bank:", err);
//     res.status(500).json({ error: "Failed to update Question Bank" });
//   }
// });

// /* ======================================================
//    📌 Delete bank + ALL questions (pagination fix)
// ====================================================== */
// router.delete("/:id", async (req, res) => {
//   try {
//     const bankId = req.params.id;

//     const questions = await getAllQuestionsForBank(bankId);

//     for (let i = 0; i < questions.length; i += 25) {
//       const chunk = questions.slice(i, i + 25).map((q) => ({
//         DeleteRequest: {
//           Key: { bankId: q.bankId, questionId: q.questionId },
//         },
//       }));

//       await ddb
//         .batchWrite({
//           RequestItems: { [process.env.DDB_QUESTIONS]: chunk },
//         })
//         .promise();
//     }

//     await ddb
//       .delete({
//         TableName: process.env.DDB_BANKS,
//         Key: { bankId },
//       })
//       .promise();

//     res.json({
//       success: true,
//       message: "✅ Question Bank deleted successfully",
//     });
//   } catch (err) {
//     console.error("❌ Error deleting Question Bank:", err);
//     res.status(500).json({ error: "Failed to delete Question Bank" });
//   }
// });

// /* ======================================================
//    📌 Publish / Unpublish
// ====================================================== */
// router.put("/publish/:bankId", async (req, res) => {
//   try {
//     const { bankId } = req.params;

//     await ddb
//       .update({
//         TableName: process.env.DDB_BANKS,
//         Key: { bankId },
//         UpdateExpression: "set #status = :s",
//         ExpressionAttributeNames: { "#status": "status" },
//         ExpressionAttributeValues: { ":s": "PUBLISHED" },
//       })
//       .promise();

//     res.json({
//       success: true,
//       message: "✅ Question Bank published successfully",
//     });
//   } catch (err) {
//     console.error("❌ Publish failed:", err);
//     res.status(500).json({ error: "Failed to publish Question Bank" });
//   }
// });

// router.put("/unpublish/:bankId", async (req, res) => {
//   try {
//     const { bankId } = req.params;

//     await ddb
//       .update({
//         TableName: process.env.DDB_BANKS,
//         Key: { bankId },
//         UpdateExpression: "set #status = :s",
//         ExpressionAttributeNames: { "#status": "status" },
//         ExpressionAttributeValues: { ":s": "UNPUBLISHED" },
//       })
//       .promise();

//     res.json({
//       success: true,
//       message: "✅ Question Bank unpublished successfully",
//     });
//   } catch (err) {
//     console.error("❌ Unpublish failed:", err);
//     res.status(500).json({ error: "Failed to unpublish Question Bank" });
//   }
// });

// module.exports = router;

// api/Route/API_Admin/AdminModule/AdminQ-BankRoute/AdminQ-BankRoute.js
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { v4: uuidv4 } = require("uuid");

/* ---------------- AWS SDK v3 wrapper (v2-style) ---------------- */
const {
  ddb, // <- wrapper (get/put/update/query/batchWrite)
  QueryCommand,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  BatchWriteCommand
} = require("../../../../Services/aws/dynamo");

const {
  s3,
  PutObjectCommand
} = require("../../../../Services/aws/s3");

const parseExcel = require("../../../../utils/q-bank_excelParser");

const router = express.Router();

/* ------------ Multer Memory Upload ------------ */
const uploadMem = multer({ storage: multer.memoryStorage() });

/* ------------ Bucket ------------ */
const S3_BUCKET =
  process.env.S3_PUBLIC_BUCKET || process.env.S3_BUCKET;

console.log("[QBANK DEBUG] Using bucket:", S3_BUCKET);

/* ------------ Normalize Difficulty ------------ */
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
   Helper: Fetch ALL Questions for Bank (pagination)
====================================================== */
async function getAllQuestionsForBank(bankId) {
  let items = [];
  let lastKey = undefined;

  do {
    const result = await ddb
      .query({
        TableName: process.env.DDB_QUESTIONS,
        KeyConditionExpression: "bankId = :b",
        ExpressionAttributeValues: { ":b": bankId },
        ExclusiveStartKey: lastKey,
      })
      .promise();

    if (result.Items) items = items.concat(result.Items);
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  return items;
}

/* ======================================================
   Upload Excel to S3
====================================================== */
async function uploadExcelBufferToS3({ bankId, fileObj }) {
  if (!fileObj) return null;

  try {
    const ext = path.extname(fileObj.originalname || "").toLowerCase() || ".xlsx";
    const key = `qbanks/${bankId}/source${ext}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: fileObj.buffer,
        ContentType:
          fileObj.mimetype ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
    );

    const cdnBase = process.env.CLOUDFRONT_PUBLIC_BASE;
    if (cdnBase) return `https://${cdnBase}/${key}`;

    return `https://${S3_BUCKET}.s3.amazonaws.com/${key}`;
  } catch (err) {
    console.error("[Excel Upload FAILED]", err);
    return null;
  }
}

/* ======================================================
   Upload Thumbnail to S3
====================================================== */
async function uploadThumbnailBufferToS3({ bankId, fileObj }) {
  if (!fileObj) return null;

  try {
    const ext = path.extname(fileObj.originalname || "").toLowerCase() || ".png";
    const key = `qbanks/${bankId}/cover${ext}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: fileObj.buffer,
        ContentType:
          fileObj.mimetype ||
          (ext === ".png"
            ? "image/png"
            : ext === ".jpg" || ext === ".jpeg"
            ? "image/jpeg"
            : "application/octet-stream"),
      })
    );

    const cdnBase = process.env.CLOUDFRONT_PUBLIC_BASE;
    if (cdnBase) return `https://${cdnBase}/${key}`;

    return `https://${S3_BUCKET}.s3.amazonaws.com/${key}`;
  } catch (err) {
    console.error("[Thumbnail Upload FAILED]", err);
    return null;
  }
}

/* ======================================================
   📌 Upload Excel + Thumbnail
====================================================== */
router.post(
  "/upload",
  uploadMem.fields([
    { name: "file", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || !req.files?.file?.[0])
        return res.status(400).json({ error: "Bank name + Excel required" });

      const excelFile = req.files.file[0];
      const thumbFile = req.files.thumbnail?.[0] || null;

      const ext = path.extname(excelFile.originalname || ".xlsx");
      const safeBase = path
        .basename(excelFile.originalname || "upload", ext)
        .replace(/[^\w.-]/g, "_");

      const tmpPath = path.join(
        os.tmpdir(),
        `qbank-${Date.now()}-${uuidv4()}-${safeBase}${ext}`
      );
      fs.writeFileSync(tmpPath, excelFile.buffer);

      const bankId = uuidv4();

      const excelFileUrl = await uploadExcelBufferToS3({
        bankId,
        fileObj: excelFile,
      });

      const thumbnailUrl = await uploadThumbnailBufferToS3({
        bankId,
        fileObj: thumbFile,
      });

      const isPaid =
        req.body.isPaid === "true" || req.body.isPaid === true;
      const pricePaise = Number(req.body.pricePaise) || 0;

      const bankItem = {
        bankId,
        name,
        createdBy: req.user?.sub || "admin",
        createdAt: new Date().toISOString(),
        status: "DRAFT",
        isPaid,
        pricePaise,
        ...(thumbnailUrl && { thumbnailUrl }),
        ...(excelFileUrl && { excelFileUrl }),
      };

      await ddb
        .put({
          TableName: process.env.DDB_BANKS,
          Item: bankItem,
        })
        .promise();

      const questions = await parseExcel(tmpPath);
      try {
        fs.unlinkSync(tmpPath);
      } catch (_) {}

      const docs = questions.map((q) => ({
        PutRequest: {
          Item: {
            bankId,
            questionId: uuidv4(),
            questionText: q.questionText,
            options: q.options,
            correctAnswer: q.correctAnswer,
            difficulty: normalizeDifficulty(q.difficulty),
            questionType: q.questionType,
            tasks: q.tasks || q.tags || "",
            tags: q.tags || q.tasks || "",
            performanceDomain: q.performanceDomain || "",
            approach: q.approach || "",
            exam: q.exam || "",
            marks: q.marks || 1,
            explanation: q.explanation || "",
            createdAt: new Date().toISOString(),
          },
        },
      }));

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

      return res.json({
        message: "Bank uploaded successfully",
        bankId,
        thumbnailUrl,
        excelFileUrl,
        totalQuestions: questions.length,
      });
    } catch (err) {
      console.error("Upload error:", err);
      return res.status(500).json({ error: "Upload failed" });
    }
  }
);

/* ======================================================
   📌 Get all banks
====================================================== */
router.get("/", async (req, res) => {
  try {
    const result = await ddb
      .scan({
        TableName: process.env.DDB_BANKS,
      })
      .promise();

    const banks = (result.Items || []).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json(
      banks.map((b) => ({
        ...b,
        isPaid: !!b.isPaid,
        pricePaise: Number(b.pricePaise) || 0,
      }))
    );
  } catch (err) {
    console.error("Error fetching banks:", err);
    res.status(500).json({ error: "Failed to fetch banks" });
  }
});

/* ======================================================
   📌 Get single bank
====================================================== */
router.get("/:bankId", async (req, res) => {
  try {
    const { bankId } = req.params;

    const result = await ddb
      .get({
        TableName: process.env.DDB_BANKS,
        Key: { bankId },
      })
      .promise();

    if (!result.Item)
      return res.status(404).json({ error: "Question Bank not found" });

    return res.json(result.Item);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to fetch bank" });
  }
});

/* ======================================================
   📌 Get ALL questions
====================================================== */
router.get("/:id/questions", async (req, res) => {
  try {
    const bankId = req.params.id;
    const { difficulty, questionType, tags, performanceDomain } = req.query;

    let questions = await getAllQuestionsForBank(bankId);

    const diffNorm = normalizeDifficulty(difficulty);
    if (diffNorm)
      questions = questions.filter(
        (q) => normalizeDifficulty(q.difficulty) === diffNorm
      );

    if (questionType)
      questions = questions.filter((q) => q.questionType === questionType);

    if (tags) questions = questions.filter((q) => q.tags === tags);

    if (performanceDomain)
      questions = questions.filter(
        (q) => q.performanceDomain === performanceDomain
      );

    questions.sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    return res.json(questions);
  } catch (err) {
    console.error("Error fetching questions:", err);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

/* ======================================================
   📌 Update Question
====================================================== */
router.put("/:bankId/questions/:questionId", async (req, res) => {
  try {
    const { bankId, questionId } = req.params;
    let updateData = req.body;

    if (!updateData || Object.keys(updateData).length === 0)
      return res.status(400).json({ error: "No update fields provided" });

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

    res.json({ success: true, message: "Question updated" });
  } catch (err) {
    console.error("Error updating question:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ======================================================
   📌 Update Bank
====================================================== */
router.put("/:bankId", uploadMem.single("thumbnail"), async (req, res) => {
  try {
    const { bankId } = req.params;
    const { name = "", description = "" } = req.body;

    const isPaid =
      req.body.isPaid === "true" || req.body.isPaid === true;

    const pricePaise = Number(req.body.pricePaise) || 0;

    let thumbnailUrl;
    if (req.file) {
      thumbnailUrl = await uploadThumbnailBufferToS3({
        bankId,
        fileObj: req.file,
      });
    }

    const fields = { name, description, isPaid, pricePaise };
    if (thumbnailUrl) fields.thumbnailUrl = thumbnailUrl;

    const clean = Object.fromEntries(
      Object.entries(fields).filter(([_, v]) => v !== undefined && v !== null)
    );

    if (Object.keys(clean).length === 0)
      return res.status(400).json({ error: "No update fields provided" });

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

    res.json({
      success: true,
      message: "Question Bank updated",
    });
  } catch (err) {
    console.error("Error updating bank:", err);
    res.status(500).json({ error: "Failed to update Question Bank" });
  }
});

/* ======================================================
   📌 Delete Bank + Questions
====================================================== */
router.delete("/:id", async (req, res) => {
  try {
    const bankId = req.params.id;

    const questions = await getAllQuestionsForBank(bankId);

    for (let i = 0; i < questions.length; i += 25) {
      const chunk = questions.slice(i, i + 25).map((q) => ({
        DeleteRequest: {
          Key: { bankId: q.bankId, questionId: q.questionId },
        },
      }));

      await ddb
        .batchWrite({
          RequestItems: {
            [process.env.DDB_QUESTIONS]: chunk,
          },
        })
        .promise();
    }

    await ddb
      .delete({
        TableName: process.env.DDB_BANKS,
        Key: { bankId },
      })
      .promise();

    res.json({
      success: true,
      message: "Question Bank deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting Question Bank:", err);
    res.status(500).json({ error: "Failed to delete Question Bank" });
  }
});

/* ======================================================
   📌 Publish / Unpublish
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
      message: "Bank published",
    });
  } catch (err) {
    console.error("Publish failed:", err);
    res.status(500).json({ error: "Failed to publish bank" });
  }
});

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
      message: "Bank unpublished",
    });
  } catch (err) {
    console.error("Unpublish failed:", err);
    res.status(500).json({ error: "Failed to unpublish bank" });
  }
});

module.exports = router;
