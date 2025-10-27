// routes/adminMockTests/delete.js
// 📌 DELETE a mock test: soft delete → purge S3 → hard delete in DynamoDB
const express = require("express");
const { getById, patchMock } = require("./repo");
const { authAccess, requireRoles } = require("../../../../../middleware/auth");
const { s3 } = require("../../../../../Services/aws/s3");
const { ddb } = require("../../../../../Services/aws/dynamo"); // ← add Dynamo client

const S3_BUCKET = process.env.S3_BUCKET;
const MOCKTESTS_TABLE = process.env.MOCKTESTS_TABLE || "MockTests"; // ← table name
const router = express.Router();

// 🔧 helper: remove all S3 keys under a folder prefix (with pagination)
async function deleteAllUnderPrefix(bucket, prefix) {
  let ContinuationToken = undefined;
  do {
    const listed = await s3
      .listObjectsV2({ Bucket: bucket, Prefix: prefix, ContinuationToken })
      .promise();

    const keys = listed.Contents?.map((o) => ({ Key: o.Key })) || [];
    if (keys.length) {
      // deleteObjects supports up to 1000 keys
      for (let i = 0; i < keys.length; i += 1000) {
        const chunk = keys.slice(i, i + 1000);
        await s3.deleteObjects({ Bucket: bucket, Delete: { Objects: chunk } }).promise();
      }
    }

    ContinuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
  } while (ContinuationToken);
}

/** DELETE /api/admin/mocktests/delete-mock/:mockTestId — full delete */
router.delete(
  "/:mockTestId",
  authAccess,
  requireRoles(["SuperAdmin", "Admin"]),
  async (req, res) => {
    try {
      const { mockTestId } = req.params;

      // 1) ensure the item exists
      const item = await getById(mockTestId);
      if (!item) return res.status(404).json({ error: "Not found" });

      // 2) soft delete (keeps an audit trace in logs/streams if you need it)
      await patchMock(mockTestId, {
        status: "DELETED",
        deletedAt: new Date().toISOString(),
      });

      // 3) purge S3 artifacts
      if (!S3_BUCKET) {
        return res.status(500).json({ error: "S3_BUCKET env not set" });
      }
      const prefix = `mocktests/${mockTestId}/`;
      await deleteAllUnderPrefix(S3_BUCKET, prefix);

      // 4) hard delete the DynamoDB row
      await ddb
        .delete({
          TableName: MOCKTESTS_TABLE,
          Key: { mockTestId }, // ⚠️ If your table uses a different key schema, adjust this
        })
        .promise();

      // 5) done
      res.json({ ok: true });
    } catch (e) {
      console.error("Delete mocktest failed:", e);
      res.status(500).json({ error: e.message || "Failed to delete mocktest" });
    }
  }
);

module.exports = router;
