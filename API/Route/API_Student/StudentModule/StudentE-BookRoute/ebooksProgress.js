const express = require("express");
const AWS = require("aws-sdk");

const router = express.Router();
AWS.config.update({ region: process.env.AWS_REGION || "ap-south-1" });

const ddb = new AWS.DynamoDB.DocumentClient();
const TABLE = process.env.DDB_EBOOK_PROGRESS || "StudentEBookProgress";

/**
 * ✅ PUT /api/ebooks/progress/update
 * Body: { userId, ebookId, chapterId, instituteId, timeSpent, completed }
 */
router.put("/update", async (req, res) => {
  try {
    const { userId, ebookId, chapterId, instituteId, timeSpent, completed } =
      req.body || {};

    if (!userId || !ebookId || !chapterId) {
      return res.status(400).json({ ok: false, message: "Missing parameters" });
    }

    const ebookChapterId = `${ebookId}#${chapterId}`;
    const now = new Date().toISOString();

    const params = {
      TableName: TABLE,
      Key: { userId, ebookChapterId },
      UpdateExpression: `
        SET
          ebookId = :e,
          chapterId = :c,
          instituteId = :i,
          updatedAt = :u,
          lastOpenedAt = if_not_exists(lastOpenedAt, :u),
          timeSpent = if_not_exists(timeSpent, :zero) + :t,
          completed = :comp
      `,
      ExpressionAttributeValues: {
        ":e": ebookId,
        ":c": chapterId,
        ":i": instituteId || "unknown",
        ":u": now,
        ":t": timeSpent || 0,
        ":zero": 0,
        ":comp": !!completed,
      },
      ReturnValues: "UPDATED_NEW",
    };

    await ddb.update(params).promise();
    res.json({ ok: true, message: "Progress updated ✅" });
  } catch (err) {
    console.error("[EBOOK PROGRESS UPDATE ERROR]", err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

/**
 * ✅ GET /api/ebooks/progress/:userId/:ebookId
 * Fetch all chapters progress for one ebook
 */
router.get("/:userId/:ebookId", async (req, res) => {
  try {
    const { userId, ebookId } = req.params;

    const params = {
      TableName: TABLE,
      KeyConditionExpression:
        "userId = :u AND begins_with(ebookChapterId, :e)",
      ExpressionAttributeValues: {
        ":u": userId,
        ":e": ebookId,
      },
    };

    const result = await ddb.query(params).promise();
    res.json({ ok: true, items: result.Items || [] });
  } catch (err) {
    console.error("[EBOOK PROGRESS FETCH ERROR]", err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;
