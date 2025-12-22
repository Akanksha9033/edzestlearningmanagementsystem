// routes/adminMockTests/delete.js

// 📌 DELETE a mock test:
// Step 1 → soft delete in database (mark as DELETED)
// Step 2 → delete all associated files from S3
// Step 3 → hard delete the record from DynamoDB

const express = require("express");

// ⭐ Helper functions from repo.js
const { getById, patchMock } = require("./repo");

// ⭐ Auth middlewares
const { authAccess, requireRoles } = require("../../../../../middleware/auth");

// ⭐ AWS S3 client (v2-style wrapper)
const { s3 } = require("../../../../../Services/aws/s3");

// ⭐ DynamoDB client (v2-style wrapper)
const { ddb } = require("../../../../../Services/aws/dynamo");

// ⭐ Environment variables
const S3_BUCKET = process.env.S3_BUCKET;
const MOCKTESTS_TABLE = process.env.MOCKTESTS_TABLE || "MockTests";

const router = express.Router();

/* ===========================================================================
   🔧 Delete all S3 keys under prefix (v2 wrapper syntax)
=========================================================================== */
async function deleteAllUnderPrefix(bucket, prefix) {
  let ContinuationToken = undefined;

  do {
    const listed = await s3
      .listObjectsV2({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken,
      })
      .promise();

    const keys = listed.Contents?.map((o) => ({ Key: o.Key })) || [];

    if (keys.length) {
      // deleteObjects supports 1000 keys per batch
      for (let i = 0; i < keys.length; i += 1000) {
        const chunk = keys.slice(i, i + 1000);

        await s3
          .deleteObjects({
            Bucket: bucket,
            Delete: { Objects: chunk },
          })
          .promise();
      }
    }

    ContinuationToken = listed.IsTruncated
      ? listed.NextContinuationToken
      : undefined;

  } while (ContinuationToken);
}

/* ===========================================================================
   📌 DELETE /api/admin/mocktests/delete-mock/:mockTestId
=========================================================================== */
router.delete(
  "/:mockTestId",
  authAccess,
  requireRoles(["SuperAdmin", "Admin"]),
  async (req, res) => {
    try {
      const { mockTestId } = req.params;

      // 1️⃣ Check if exists
      const item = await getById(mockTestId);
      if (!item) return res.status(404).json({ error: "Not found" });

      // 2️⃣ Soft delete in database
      await patchMock(mockTestId, {
        status: "DELETED",
        deletedAt: new Date().toISOString(),
      });

      // 3️⃣ Delete S3 files
      if (!S3_BUCKET) {
        return res.status(500).json({ error: "S3_BUCKET env not set" });
      }

      const prefix = `mocktests/${mockTestId}/`;

      await deleteAllUnderPrefix(S3_BUCKET, prefix);

      // 4️⃣ Hard delete from DynamoDB
      await ddb
        .delete({
          TableName: MOCKTESTS_TABLE,
          Key: { mockTestId },
        })
        .promise();

      // 5️⃣ Done
      res.json({ ok: true });

    } catch (e) {
      console.error("Delete mocktest failed:", e);
      res.status(500).json({
        error: e.message || "Failed to delete mocktest",
      });
    }
  }
);

module.exports = router;
