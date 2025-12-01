const express = require("express");
const router = express.Router();

// --- AWS SDK v3 (global shared wrapper) ---
// ddb  = DocumentClient
// PutCommand = insert/overwrite item
const {
  ddb,
  PutCommand,
} = require("../../../../Services/aws/dynamo");

// DynamoDB table name for student’s ebook progress
// Fallback to "StudentEBookProgress"
const TABLE =
  process.env.DDB_STUDENT_EBOOK_PROGRESS || "StudentEBookProgress";

/**
 * ==========================================================
 *  PUT /api/student/ebooks/progress
 *  This route saves/updates user reading progress for e-book
 * 
 *  Expected Body:
 *    {
 *      userId: "U123",
 *      ebookId: "EBOOK_001",
 *      chapterId: "CH_03",
 *      timeSpent: 120,     // seconds
 *      completed: true/false
 *    }
 * 
 *  IMPORTANT:
 *  The PK (Primary Key) used is:
 *      userId + ebookChapterId (ebookId#chapterId)
 * 
 *  This makes each user-chapter combination UNIQUE.
 * ==========================================================
 */
router.put("/", async (req, res) => {
  try {
    const {
      userId,
      ebookId,
      chapterId,
      timeSpent = 0,         // default → 0 sec
      completed = false,     // default → not completed
    } = req.body || {};

    // Validation check
    if (!userId || !ebookId || !chapterId) {
      return res
        .status(400)
        .json({ ok: false, message: "Missing fields" });
    }

    // Capture the current timestamp
    const now = new Date().toISOString();

    // Final object to write in DynamoDB
    const params = {
      TableName: TABLE,
      Item: {
        userId,                                 // partition key
        ebookChapterId: `${ebookId}#${chapterId}`, // sort key
        ebookId,
        chapterId,
        timeSpent,
        completed,
        updatedAt: now,
      },
    };

    // PutCommand = full overwrite or upsert
    await ddb.send(new PutCommand(params));

    return res.json({ ok: true, message: "Progress updated" });
  } catch (err) {
    console.error("[StudentEBookProgress] error", err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;
