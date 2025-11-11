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

// // ✅ the Express router MUST be created near top so it exists before we define routes
// const router = express.Router();

// /* ---------- Multer: in-memory (no folders on disk) ---------- */
// const uploadMem = multer({ storage: multer.memoryStorage() });

// /* ---------- Env / Bucket setup ---------- */
// const S3_BUCKET = process.env.S3_PUBLIC_BUCKET || process.env.S3_BUCKET;
// console.log("[QBANK DEBUG] Using bucket:", S3_BUCKET);

// /* ✅ Helper: legacy difficulty normalization (used in filters) */
// const normalizeDifficulty = (v) => {
//   const s = String(v ?? "")
//     .trim()
//     .toLowerCase();
//   if (!s) return "";
//   if (s === "difficult" || s.startsWith("diff")) return "Hard";
//   if (s === "hard") return "Hard";
//   if (s.startsWith("easy")) return "Easy";
//   if (s.startsWith("med")) return "Medium";
//   return v;
// };

// /* ============================================================
//    S3 Upload Helpers
//    (NO ACL because bucket blocks ACLs; uses SSE if provided)
// ============================================================ */

// /**
//  * Upload Excel buffer to S3
//  * returns URL or null
//  */
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
//       console.warn("[QBank Upload] S3 bucket not set. Skipping Excel upload.");
//       return null;
//     }

//     await s3
//       .putObject({
//         Bucket: S3_BUCKET,
//         Key: key,
//         Body: fileObj.buffer,
//         ContentType: contentTypeGuess,
//         ServerSideEncryption: process.env.S3_SSE || undefined, // e.g. AES256
//       })
//       .promise();

//     const cdnBase = process.env.CLOUDFRONT_PUBLIC_BASE;
//     if (cdnBase && cdnBase.trim() !== "") {
//       return `https://${cdnBase}/${key}`;
//     }

//     return `https://${S3_BUCKET}.s3.amazonaws.com/${key}`;
//   } catch (err) {
//     console.error("[QBank Upload] Excel S3 upload failed:", err);
//     return null;
//   }
// }

// /**
//  * Upload thumbnail buffer to S3
//  * returns URL or null
//  */
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
//       console.warn(
//         "[QBank Upload] S3 bucket not set. Skipping thumbnail upload."
//       );
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
//     if (cdnBase && cdnBase.trim() !== "") {
//       return `https://${cdnBase}/${key}`;
//     }

//     return `https://${S3_BUCKET}.s3.amazonaws.com/${key}`;
//   } catch (err) {
//     console.error("[QBank Upload] Thumbnail S3 upload failed:", err);
//     return null;
//   }
// }

// /* ======================================================
//    📌 Upload Excel (+ optional thumbnail)
//    -> Create QuestionBank row in DynamoDB
//    -> Create Questions in DynamoDB
//    -> Store Excel + thumbnail in S3
//    ✅ Normalization + DRAFT status
//    ✅ Uses os.tmpdir() for parseExcel (works on Windows & Lambda)
// ====================================================== */
// router.post(
//   "/upload",
//   uploadMem.fields([
//     { name: "file", maxCount: 1 }, // Excel file (required)
//     { name: "thumbnail", maxCount: 1 }, // optional cover image
//   ]),
//   async (req, res) => {
//     try {
//       const { name } = req.body;

//       // validation: need name + Excel buffer
//       if (
//         !name ||
//         !req.files ||
//         !req.files.file ||
//         !req.files.file[0] ||
//         !req.files.file[0].buffer
//       ) {
//         return res
//           .status(400)
//           .json({ error: "Bank name and Excel file required" });
//       }

//       const excelFile = req.files.file[0]; // required
//       const thumbFile =
//         req.files.thumbnail && req.files.thumbnail[0]
//           ? req.files.thumbnail[0]
//           : null; // optional

//       // write Excel buffer to a temp file so we can parse it
//       const ext = path.extname(excelFile.originalname || ".xlsx") || ".xlsx";
//       const safeBase = path
//         .basename(excelFile.originalname || "upload", ext)
//         .replace(/[^\w.-]/g, "_");

//       const tmpPath = path.join(
//         os.tmpdir(),
//         `qbank-${Date.now()}-${uuidv4()}-${safeBase}${ext}`
//       );

//       fs.writeFileSync(tmpPath, excelFile.buffer);

//       // create bankId now (we'll reuse it for S3 keys and DynamoDB PK)
//       const bankId = uuidv4();

//       // upload source.xlsx and cover.png/jpg to S3
//       const excelFileUrl = await uploadExcelBufferToS3({
//         bankId,
//         fileObj: excelFile,
//       });

//       const thumbnailUrl = await uploadThumbnailBufferToS3({
//         bankId,
//         fileObj: thumbFile,
//       });

//       // save bank metadata in DDB_BANKS table
//       const bankItem = {
//         bankId,
//         name,
//         createdBy: req.user?.sub || "admin",
//         createdAt: new Date().toISOString(),
//         status: "DRAFT",
//       };
//       if (thumbnailUrl) bankItem.thumbnailUrl = thumbnailUrl;
//       if (excelFileUrl) bankItem.excelFileUrl = excelFileUrl;

//       await ddb
//         .put({
//           TableName: process.env.DDB_BANKS,
//           Item: bankItem,
//         })
//         .promise();

//       // parse Excel -> questions[]
//       const questions = await parseExcel(tmpPath);

//       // cleanup tmp file
//       try {
//         fs.unlinkSync(tmpPath);
//       } catch (e) {}

//       // normalize helper for difficulty & questionType (same logic you had)
//       const normalize = (val, type) => {
//         if (!val) return "";
//         const str = String(val).trim().toLowerCase();

//         if (type === "difficulty") {
//           if (str.startsWith("easy")) return "Easy";
//           if (str.startsWith("med")) return "Medium";
//           if (str.startsWith("diff")) return "Hard";
//           if (str === "hard") return "Hard";
//         }

//         if (type === "questionType") {
//           if (str.includes("single")) return "Single-Select";
//           if (str.includes("multi")) return "Multi-Select";
//           if (str.includes("blank")) return "Fill-in-the-Blank";
//           if (str.includes("true")) return "True/False";
//         }

//         return String(val).trim();
//       };

//       // batchWrite questions into DDB_QUESTIONS
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

//       // respond to frontend
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
//    📌 View all banks
// ====================================================== */
// router.get("/", async (req, res) => {
//   try {
//     const result = await ddb
//       .scan({ TableName: process.env.DDB_BANKS })
//       .promise();

//     const banks = (result.Items || []).sort(
//       (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
//     );

//     res.json(banks);
//   } catch (err) {
//     console.error("❌ Error fetching banks", err);
//     res.status(500).json({ error: "Failed to fetch banks" });
//   }
// });

// /* Get a single bank (used by Settings page) */
// router.get("/:bankId", async (req, res) => {
//   try {
//     const { bankId } = req.params;

//     const result = await ddb
//       .get({ TableName: process.env.DDB_BANKS, Key: { bankId } })
//       .promise();

//     if (!result.Item) {
//       return res.status(404).json({ error: "Question Bank not found" });
//     }

//     return res.json(result.Item);
//   } catch (err) {
//     console.error("❌ Error fetching bank:", err);
//     res.status(500).json({ error: "Failed to fetch bank" });
//   }
// });

// /* ======================================================
//    📌 Get all questions of a bank (with optional filters)
// ====================================================== */
// router.get("/:id/questions", async (req, res) => {
//   try {
//     const bankId = req.params.id;
//     const { difficulty, questionType, tags, performanceDomain } = req.query;

//     const result = await ddb
//       .query({
//         TableName: process.env.DDB_QUESTIONS,
//         KeyConditionExpression: "bankId = :b",
//         ExpressionAttributeValues: { ":b": bankId },
//       })
//       .promise();

//     let questions = result.Items || [];

//     // normalize incoming difficulty once
//     const diffNorm = normalizeDifficulty(difficulty);

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

//     questions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

//     res.json(questions);
//   } catch (err) {
//     console.error("❌ Error fetching questions", err);
//     res.status(500).json({ error: "Failed to fetch questions" });
//   }
// });

// /* ======================================================
//    📌 Update a single question
// ====================================================== */
// router.put("/:bankId/questions/:questionId", async (req, res) => {
//   try {
//     const { bankId, questionId } = req.params;
//     let updateData = req.body;

//     if (!updateData || Object.keys(updateData).length === 0) {
//       return res.status(400).json({ error: "No update fields provided" });
//     }

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
//    📌 Update bank meta (name/description/thumbnail manual edit)
//    (qbsetting page)
// ====================================================== */
// router.put("/:bankId", uploadMem.single("thumbnail"), async (req, res) => {
//   try {
//     const { bankId } = req.params;
//     const { name = "", description = "" } = req.body;

//     let thumbnailUrl;
//     if (req.file) {
//       // we keep existing UI contract: pretend there's an /uploads/... path
//       // (you can later switch this to call uploadThumbnailBufferToS3 if you want S3 here too)
//       const ext = path.extname(req.file.originalname || "");
//       const base = path
//         .basename(req.file.originalname || "thumb", ext)
//         .replace(/[^\w.-]/g, "_");
//       const synthesized = `${Date.now()}-${base}${ext || ""}`;

//       thumbnailUrl = `/uploads/${synthesized}`;
//     }

//     const fields = { name, description };
//     if (thumbnailUrl) fields.thumbnailUrl = thumbnailUrl;

//     const clean = Object.fromEntries(
//       Object.entries(fields).filter(([_, v]) => v !== undefined && v !== null)
//     );

//     if (Object.keys(clean).length === 0) {
//       return res.status(400).json({ error: "No update fields provided" });
//     }

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
//    📌 Delete a Question Bank and its Questions
// ====================================================== */
// router.delete("/:id", async (req, res) => {
//   try {
//     const bankId = req.params.id;

//     // fetch all questions
//     const result = await ddb
//       .query({
//         TableName: process.env.DDB_QUESTIONS,
//         KeyConditionExpression: "bankId = :b",
//         ExpressionAttributeValues: { ":b": bankId },
//       })
//       .promise();

//     const questions = result.Items || [];

//     // batch delete each chunk of 25
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

//     // delete the QuestionBank record
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

const express = require("express"); // Import Express framework (for routing HTTP requests)
const multer = require("multer"); // Multer: middleware for handling multipart/form-data (file uploads)
const fs = require("fs"); // Node file system module: for reading/writing files
const path = require("path"); // Path module: helps to build file paths in a safe way
const os = require("os"); // OS module: we use os.tmpdir() for temp folder (works on Windows + Linux)
const { v4: uuidv4 } = require("uuid"); // UUID v4 generator: used for unique IDs (bankId, questionId)
const AWS = require("aws-sdk"); // AWS SDK: used for S3 (and Dynamo in other files)
const { ddb } = require("../../../../Services/aws/dynamo"); // Our configured DynamoDB DocumentClient
const parseExcel = require("../../../../utils/q-bank_excelParser"); // Custom helper to convert Excel into questions array

/* ---------- AWS Setup ---------- */
AWS.config.update({ region: process.env.AWS_REGION || "ap-south-1" }); // Set AWS region from env, default to ap-south-1
const s3 = new AWS.S3(); // Create an S3 client to upload Excel/thumbnail

// ✅ the Express router MUST be created near top so it exists before we define routes
const router = express.Router(); // Create a new router object. All routes in this file attach to this router.

/* ---------- Multer: in-memory (no folders on disk) ---------- */
const uploadMem = multer({ storage: multer.memoryStorage() }); 
// Configure multer to store uploaded files in memory (buffer) instead of saving to disk directly

/* ---------- Env / Bucket setup ---------- */
const S3_BUCKET = process.env.S3_PUBLIC_BUCKET || process.env.S3_BUCKET; 
// S3 bucket name comes from env: prefer S3_PUBLIC_BUCKET, else fallback to S3_BUCKET
console.log("[QBANK DEBUG] Using bucket:", S3_BUCKET); // Log to know which bucket is being used

/* ✅ Helper: legacy difficulty normalization (used in filters) */
const normalizeDifficulty = (v) => {
  const s = String(v ?? "").trim().toLowerCase(); // Convert value to string, trim, and lowercase
  if (!s) return ""; // if empty, return empty string

  // Map different text values into standard ones
  if (s === "difficult" || s.startsWith("diff")) return "Hard";
  if (s === "hard") return "Hard";
  if (s.startsWith("easy")) return "Easy";
  if (s.startsWith("med")) return "Medium";
  return v; // otherwise return original value (no change)
};

/* ============================================================
   S3 Upload Helpers
   (NO ACL because bucket blocks ACLs; uses SSE if provided)
============================================================ */

/**
 * Upload Excel buffer to S3
 * returns URL or null
 */
async function uploadExcelBufferToS3({ bankId, fileObj }) {
  if (!fileObj) return null; // if no file object, just return null

  try {
    const extFromName = path.extname(fileObj.originalname || "").toLowerCase(); // get extension from original file name
    const finalExt = extFromName || ".xlsx"; // default to .xlsx if no extension found

    // S3 object key (path inside bucket)
    const key = `qbanks/${bankId}/source${finalExt}`;

    // Guess content-type header; if not provided by multer, use standard Excel MIME type
    const contentTypeGuess =
      fileObj.mimetype ||
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    if (!S3_BUCKET) {
      // If bucket is not configured, we can't upload
      console.warn("[QBank Upload] S3 bucket not set. Skipping Excel upload.");
      return null;
    }

    // Upload the Excel file buffer to S3
    await s3
      .putObject({
        Bucket: S3_BUCKET, // target bucket
        Key: key, // object key (folder+file inside bucket)
        Body: fileObj.buffer, // actual file data from memory
        ContentType: contentTypeGuess, // MIME type for browser
        ServerSideEncryption: process.env.S3_SSE || undefined, // optional server-side encryption (AES256 etc.)
      })
      .promise(); // .promise() to use async/await

    const cdnBase = process.env.CLOUDFRONT_PUBLIC_BASE; // optional CloudFront domain for faster CDN URLs
    if (cdnBase && cdnBase.trim() !== "") {
      // return CloudFront URL if configured
      return `https://${cdnBase}/${key}`;
    }

    // otherwise return direct S3 URL
    return `https://${S3_BUCKET}.s3.amazonaws.com/${key}`;
  } catch (err) {
    console.error("[QBank Upload] Excel S3 upload failed:", err); // log error
    return null; // fail gracefully without crashing the whole upload
  }
}

/**
 * Upload thumbnail buffer to S3
 * returns URL or null
 */
async function uploadThumbnailBufferToS3({ bankId, fileObj }) {
  if (!fileObj) return null; // no thumbnail? return null

  try {
    const extFromName = path.extname(fileObj.originalname || "").toLowerCase(); // get extension (.png, .jpg...)
    const finalExt = extFromName || ".png"; // default to .png

    // S3 object key for thumbnail image
    const key = `qbanks/${bankId}/cover${finalExt}`;

    // Decide MIME type based on extension if mimetype missing
    const contentTypeGuess =
      fileObj.mimetype ||
      (finalExt === ".png"
        ? "image/png"
        : finalExt === ".jpg" || finalExt === ".jpeg"
        ? "image/jpeg"
        : "application/octet-stream");

    if (!S3_BUCKET) {
      console.warn("[QBank Upload] S3 bucket not set. Skipping thumbnail upload.");
      return null;
    }

    // Upload thumbnail to S3
    await s3
      .putObject({
        Bucket: S3_BUCKET,
        Key: key,
        Body: fileObj.buffer,
        ContentType: contentTypeGuess,
        ServerSideEncryption: process.env.S3_SSE || undefined,
      })
      .promise();

    const cdnBase = process.env.CLOUDFRONT_PUBLIC_BASE;
    if (cdnBase && cdnBase.trim() !== "") {
      // CloudFront URL if available
      return `https://${cdnBase}/${key}`;
    }

    // fallback direct S3 URL
    return `https://${S3_BUCKET}.s3.amazonaws.com/${key}`;
  } catch (err) {
    console.error("[QBank Upload] Thumbnail S3 upload failed:", err);
    return null;
  }
}

/* ======================================================
   📌 Upload Excel (+ optional thumbnail)
   -> Create QuestionBank row in DynamoDB
   -> Create Questions in DynamoDB
   -> Store Excel + thumbnail in S3
   ✅ Normalization + DRAFT status
   ✅ Uses os.tmpdir() for parseExcel (works on Windows & Lambda)
====================================================== */
router.post(
  "/upload", // POST /api/admin/qbank/upload (depending on how you mounted this router)
  uploadMem.fields([
    { name: "file", maxCount: 1 }, // Excel file (required) field name: "file"
    { name: "thumbnail", maxCount: 1 }, // optional cover image field name: "thumbnail"
  ]),
  async (req, res) => {
    try {
      const { name } = req.body; // bank name from form-data body

      // validation: need name + Excel buffer
      if (
        !name || // name missing?
        !req.files ||
        !req.files.file ||
        !req.files.file[0] ||
        !req.files.file[0].buffer
      ) {
        // If any of these missing, send 400 Bad Request
        return res
          .status(400)
          .json({ error: "Bank name and Excel file required" });
      }

      const excelFile = req.files.file[0]; // required Excel file
      const thumbFile =
        req.files.thumbnail && req.files.thumbnail[0]
          ? req.files.thumbnail[0]
          : null; // optional thumbnail (may be null)

      // write Excel buffer to a temp file so we can parse it using parseExcel
      const ext = path.extname(excelFile.originalname || ".xlsx") || ".xlsx";
      const safeBase = path
        .basename(excelFile.originalname || "upload", ext)
        .replace(/[^\w.-]/g, "_"); // sanitize filename (only letters/numbers/_ . -)

      const tmpPath = path.join(
        os.tmpdir(), // OS-specific temp directory (works on Lambda & Windows)
        `qbank-${Date.now()}-${uuidv4()}-${safeBase}${ext}` // unique file name
      );

      fs.writeFileSync(tmpPath, excelFile.buffer); // create temp physical file from memory buffer

      // create bankId now (we'll reuse it for S3 keys and DynamoDB PK)
      const bankId = uuidv4();

      // upload source.xlsx and cover.png/jpg to S3, get public URLs
      const excelFileUrl = await uploadExcelBufferToS3({
        bankId,
        fileObj: excelFile,
      });

      const thumbnailUrl = await uploadThumbnailBufferToS3({
        bankId,
        fileObj: thumbFile,
      });

      // save bank metadata in DDB_BANKS table
      const bankItem = {
        bankId, // partition key / unique identifier for this question bank
        name, // bank name sent by admin
        createdBy: req.user?.sub || "admin", // user id from auth, fallback "admin" if not available
        createdAt: new Date().toISOString(), // timestamp in ISO format
        status: "DRAFT", // initial status: DRAFT (not yet published)
      };
      if (thumbnailUrl) bankItem.thumbnailUrl = thumbnailUrl; // optional thumbnail URL
      if (excelFileUrl) bankItem.excelFileUrl = excelFileUrl; // optional Excel source URL

      // Insert bankItem into DynamoDB DDB_BANKS table
      await ddb
        .put({
          TableName: process.env.DDB_BANKS, // name of DynamoDB table from env
          Item: bankItem, // full object to store
        })
        .promise();

      // parse Excel temp file -> returns array of question objects
      const questions = await parseExcel(tmpPath);

      // cleanup tmp file after parsing
      try {
        fs.unlinkSync(tmpPath);
      } catch (e) {
        // ignore errors while deleting temp file
      }

      // normalize helper for difficulty & questionType (same logic you had)
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

      // Prepare batchWrite payload for all questions
      const docs = questions.map((q) => ({
        PutRequest: {
          Item: {
            bankId, // link question to this bank
            questionId: uuidv4(), // unique question id
            questionText: q.questionText, // actual question text
            options: q.options, // options array
            correctAnswer: q.correctAnswer, // correct answer index/value
            difficulty: normalize(q.difficulty, "difficulty"), // normalized difficulty
            questionType: normalize(q.questionType, "questionType"), // normalized type (Single-Select etc.)
            // tasks / tags: we store whichever is present, keep old behaviour
            tasks: q.tasks
              ? String(q.tasks).trim()
              : q.tags
              ? String(q.tags).trim()
              : "",
            tags: q.tags
              ? String(q.tags).trim()
              : q.tasks
              ? String(q.tasks).trim()
              : "",
            performanceDomain: q.performanceDomain
              ? String(q.performanceDomain).trim()
              : "",
            approach: q.approach ? String(q.approach).trim() : "",
            exam: q.exam ? String(q.exam).trim() : "",
            marks: q.marks || 1, // default marks = 1
            explanation: q.explanation || "", // explanation text
            createdAt: new Date().toISOString(), // timestamp for sorting
          },
        },
      }));

      // Actually write questions to DynamoDB using batchWrite (25 at a time)
      if (docs.length > 0) {
        for (let i = 0; i < docs.length; i += 25) {
          const chunk = docs.slice(i, i + 25); // group of up to 25 items
          await ddb
            .batchWrite({
              RequestItems: {
                [process.env.DDB_QUESTIONS]: chunk, // target questions table
              },
            })
            .promise();
        }
      }

      // respond to frontend with basic info
      return res.json({
        message: "✅ Bank uploaded successfully",
        bankId,
        thumbnailUrl: thumbnailUrl || null,
        excelFileUrl: excelFileUrl || null,
        totalQuestions: questions.length,
      });
    } catch (err) {
      console.error("❌ Upload error", err);
      return res.status(500).json({ error: "Upload failed" });
    }
  }
);

/* ======================================================
   📌 View all banks
====================================================== */
router.get("/", async (req, res) => {
  try {
    // Scan entire DDB_BANKS table (for small-medium data, okay)
    const result = await ddb
      .scan({ TableName: process.env.DDB_BANKS })
      .promise();

    const banks = (result.Items || []).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    ); // sort banks by creation time, newest first

    res.json(banks); // send list of banks to frontend
  } catch (err) {
    console.error("❌ Error fetching banks", err);
    res.status(500).json({ error: "Failed to fetch banks" });
  }
});

/* Get a single bank (used by Settings page) */
router.get("/:bankId", async (req, res) => {
  try {
    const { bankId } = req.params; // get bankId from URL /:bankId

    const result = await ddb
      .get({ TableName: process.env.DDB_BANKS, Key: { bankId } })
      .promise();

    if (!result.Item) {
      // if no bank found, send 404
      return res.status(404).json({ error: "Question Bank not found" });
    }

    return res.json(result.Item); // return bank data
  } catch (err) {
    console.error("❌ Error fetching bank:", err);
    res.status(500).json({ error: "Failed to fetch bank" });
  }
});

/* ======================================================
   📌 Get all questions of a bank (with optional filters)
====================================================== */
router.get("/:id/questions", async (req, res) => {
  try {
    const bankId = req.params.id; // bankId from URL /:id/questions
    const { difficulty, questionType, tags, performanceDomain } = req.query; 
    // optional filters from query string

    // Get all questions for this bankId using partition key
    const result = await ddb
      .query({
        TableName: process.env.DDB_QUESTIONS,
        KeyConditionExpression: "bankId = :b", // bankId must equal :b
        ExpressionAttributeValues: { ":b": bankId },
      })
      .promise();

    let questions = result.Items || [];

    // normalize incoming difficulty once (for comparison)
    const diffNorm = normalizeDifficulty(difficulty);

    // Apply filters in memory (same logic as your old code)
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

    // sort by createdAt in ascending order (oldest first)
    questions.sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    res.json(questions); // send filtered questions to frontend
  } catch (err) {
    console.error("❌ Error fetching questions", err);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

/* ======================================================
   📌 Update a single question
====================================================== */
router.put("/:bankId/questions/:questionId", async (req, res) => {
  try {
    const { bankId, questionId } = req.params; // path params
    let updateData = req.body; // JSON body: fields to update

    if (!updateData || Object.keys(updateData).length === 0) {
      // nothing to update
      return res.status(400).json({ error: "No update fields provided" });
    }

    // We never allow bankId or questionId in update body
    delete updateData.bankId;
    delete updateData.questionId;

    // Remove undefined/null values so we don't overwrite with null
    updateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, v]) => v !== undefined && v !== null)
    );

    // Build dynamic UpdateExpression: "set #f0 = :v0, #f1 = :v1, ..."
    const updateExpr =
      "set " +
      Object.keys(updateData)
        .map((k, i) => `#f${i} = :v${i}`)
        .join(", ");

    // Map field names to placeholder names (#f0, #f1, ...)
    const exprAttrNames = Object.keys(updateData).reduce(
      (acc, k, i) => ({ ...acc, [`#f${i}`]: k }),
      {}
    );

    // Map values to placeholder values (:v0, :v1, ...)
    const exprAttrValues = Object.values(updateData).reduce(
      (acc, v, i) => ({ ...acc, [`:v${i}`]: v }),
      {}
    );

    // Perform update in DynamoDB
    await ddb
      .update({
        TableName: process.env.DDB_QUESTIONS, // questions table
        Key: { bankId, questionId }, // composite key: (bankId, questionId)
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

/* ======================================================
   📌 Update bank meta (name/description/thumbnail manual edit)
   (qbsetting page)
====================================================== */
router.put("/:bankId", uploadMem.single("thumbnail"), async (req, res) => {
  try {
    const { bankId } = req.params; // which bank to update
    const { name = "", description = "" } = req.body; // new name/description

   let thumbnailUrl;
if (req.file) {
  // ✅ Ab settings se bhi thumbnail S3 par upload hoga
  const uploadedThumb = await uploadThumbnailBufferToS3({
    bankId,
    fileObj: req.file,
  });

  if (uploadedThumb) {
    thumbnailUrl = uploadedThumb; // full S3 URL / CLOUDFRONT URL
  }
}


    const fields = { name, description }; // fields to update
    if (thumbnailUrl) fields.thumbnailUrl = thumbnailUrl; // only add thumbnailUrl if we have one

    const clean = Object.fromEntries(
      Object.entries(fields).filter(([_, v]) => v !== undefined && v !== null)
    );

    if (Object.keys(clean).length === 0) {
      return res.status(400).json({ error: "No update fields provided" });
    }

    // Build dynamic UpdateExpression for banks table (same pattern as above)
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
        TableName: process.env.DDB_BANKS, // banks table
        Key: { bankId }, // primary key
        UpdateExpression: updateExpr,
        ExpressionAttributeNames: exprAttrNames,
        ExpressionAttributeValues: exprAttrValues,
      })
      .promise();

    return res.json({
      success: true,
      message: "✅ Question Bank updated",
    });
  } catch (err) {
    console.error("❌ Error updating bank:", err);
    res.status(500).json({ error: "Failed to update Question Bank" });
  }
});

/* ======================================================
   📌 Delete a Question Bank and its Questions
====================================================== */
router.delete("/:id", async (req, res) => {
  try {
    const bankId = req.params.id; // which bank to delete

    // fetch all questions belonging to this bank
    const result = await ddb
      .query({
        TableName: process.env.DDB_QUESTIONS,
        KeyConditionExpression: "bankId = :b",
        ExpressionAttributeValues: { ":b": bankId },
      })
      .promise();

    const questions = result.Items || [];

    // batch delete each chunk of 25 questions
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

    // delete the QuestionBank record itself
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
   📌 Publish / Unpublish
====================================================== */
router.put("/publish/:bankId", async (req, res) => {
  try {
    const { bankId } = req.params;

    // Set status field to "PUBLISHED" in DDB_BANKS table
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

router.put("/unpublish/:bankId", async (req, res) => {
  try {
    const { bankId } = req.params;

    // Set status field to "UNPUBLISHED"
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

module.exports = router; // Export router so main app can mount it under /api/admin/qbank (or similar)
