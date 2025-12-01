const express = require("express");
const router = express.Router();

// ---- AWS SDK v3 (global shared wrapper) ----
// ddb  = shared DynamoDBDocumentClient from Services/aws/dynamo
// UpdateCommand, QueryCommand = AWS v3 commands
const {
  ddb,
  UpdateCommand,
  QueryCommand,
} = require("../../../../Services/aws/dynamo");

// DynamoDB table name for storing student ebook progress
const TABLE = process.env.DDB_EBOOK_PROGRESS || "StudentEBookProgress";

/**
 * ============================================================
 * PUT /api/ebooks/progress/update
 * ------------------------------------------------------------
 * Purpose: Update the reading progress of a student for ONE
 * chapter inside an e-book.
 *
 * Body:
 *   {
 *     userId,
 *     ebookId,
 *     chapterId,
 *     instituteId,
 *     timeSpent,
 *     completed
 *   }
 *
 * Logic:
 *   ✔ Creates or updates progress item
 *   ✔ Adds timeSpent incrementally (+=)
 *   ✔ Marks completed = true/false
 *   ✔ Tracks timestamps (updatedAt, lastOpenedAt)
 * ============================================================
 */
router.put("/update", async (req, res) => {
  try {
    // Extract fields from request body
    const { userId, ebookId, chapterId, instituteId, timeSpent, completed } =
      req.body || {};

    // Validate required fields
    if (!userId || !ebookId || !chapterId) {
      return res.status(400).json({ ok: false, message: "Missing parameters" });
    }

    // Primary Key (userId + ebookChapterId)
    const ebookChapterId = `${ebookId}#${chapterId}`;
    const now = new Date().toISOString();

    // DynamoDB UpdateCommand parameters
    const params = {
      TableName: TABLE,
      Key: { userId, ebookChapterId }, // PK = userId, SK = ebookId#chapterId

      // SET expression
      UpdateExpression: `
        SET
          ebookId = :e,                      -- always store ebookId
          chapterId = :c,                    -- always store chapterId
          instituteId = :i,                  -- store institute
          updatedAt = :u,                    -- update timestamp
          lastOpenedAt = if_not_exists(lastOpenedAt, :u),  -- set once
          timeSpent = if_not_exists(timeSpent, :zero) + :t, -- increment time
          completed = :comp                  -- completion boolean
      `,

      // Values for placeholders
      ExpressionAttributeValues: {
        ":e": ebookId,
        ":c": chapterId,
        ":i": instituteId || "unknown",
        ":u": now,
        ":t": timeSpent || 0,
        ":zero": 0,
        ":comp": !!completed, // convert to boolean
      },

      ReturnValues: "UPDATED_NEW", // return updated attributes
    };

    // Update in DynamoDB
    await ddb.send(new UpdateCommand(params));

    res.json({ ok: true, message: "Progress updated ✅" });
  } catch (err) {
    console.error("[EBOOK PROGRESS UPDATE ERROR]", err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

/**
 * ============================================================
 * GET /api/ebooks/progress/:userId/:ebookId
 * ------------------------------------------------------------
 * Purpose: Fetch ALL chapter progress for a specific ebook
 * for ONE student.
 *
 * Example:
 *   /api/ebooks/progress/USER123/EBOOK55
 *
 * Logic:
 *   ✔ Query DynamoDB
 *   ✔ Partition Key = userId
 *   ✔ Sort Key startsWith ebookId#
 *   ✔ Returns an array of chapters with progress info
 * ============================================================
 */
router.get("/:userId/:ebookId", async (req, res) => {
  try {
    const { userId, ebookId } = req.params;

    // Query: all items where
    // PK = userId
    // SK begins with ebookId (ebookId#chapterId)
    const params = {
      TableName: TABLE,
      KeyConditionExpression:
        "userId = :u AND begins_with(ebookChapterId, :e)",
      ExpressionAttributeValues: {
        ":u": userId,
        ":e": ebookId, // prefix match
      },
    };

    // Run QueryCommand
    const result = await ddb.send(new QueryCommand(params));

    res.json({ ok: true, items: result.Items || [] });
  } catch (err) {
    console.error("[EBOOK PROGRESS FETCH ERROR]", err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router; 
