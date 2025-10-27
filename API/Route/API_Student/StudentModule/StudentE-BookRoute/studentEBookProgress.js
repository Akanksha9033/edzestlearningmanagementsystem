const express = require("express");
const AWS = require("aws-sdk");

AWS.config.update({ region: process.env.AWS_REGION || "ap-south-1" });
const ddb = new AWS.DynamoDB.DocumentClient();

const router = express.Router();
const TABLE = process.env.DDB_STUDENT_EBOOK_PROGRESS || "StudentEBookProgress";

/**
 * ✅ PUT /api/student/ebooks/progress
 * Body: { userId, ebookId, chapterId, timeSpent, completed }
 */
router.put("/", async (req, res) => {
  try {
    const { userId, ebookId, chapterId, timeSpent = 0, completed = false } =
      req.body || {};

    if (!userId || !ebookId || !chapterId) {
      return res.status(400).json({ ok: false, message: "Missing fields" });
    }

    const now = new Date().toISOString();

    const params = {
      TableName: TABLE,
      Item: {
        userId,
        ebookChapterId: `${ebookId}#${chapterId}`, // composite key for uniqueness
        ebookId,
        chapterId,
        timeSpent,
        completed,
        updatedAt: now,
      },
    };

    await ddb.put(params).promise();
    return res.json({ ok: true, message: "Progress updated" });
  } catch (err) {
    console.error("[StudentEBookProgress] error", err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;
