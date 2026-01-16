/********************************************
 * DELETE MOCKTEST + DELETE FULL S3 FOLDER
 ********************************************/

const express = require("express");
const router = express.Router();

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, DeleteCommand } = require("@aws-sdk/lib-dynamodb");

const { 
  S3Client,
  ListObjectsV2Command,
  DeleteObjectCommand
} = require("@aws-sdk/client-s3");

const REGION = process.env.AWS_REGION || "ap-south-1";
const MOCKTESTS_TABLE = process.env.MOCKTESTS_TABLE;   // Example: "MockTests"
const S3_BUCKET = process.env.S3_BUCKET;               // Example: "edzest-bucket"

// DynamoDB Client
const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: REGION })
);

// S3 Client
const s3 = new S3Client({ region: REGION });

/*********************************************
 * Helper to delete EVERYTHING inside folder
 *********************************************/
const deleteS3Folder = async (prefix) => {
  try {
    // 1️⃣ List all objects under the prefix
    const listed = await s3.send(
      new ListObjectsV2Command({
        Bucket: S3_BUCKET,
        Prefix: prefix,
      })
    );

    if (!listed.Contents || listed.Contents.length === 0) {
      console.log("No S3 files to delete for:", prefix);
      return;
    }

    // 2️⃣ Delete every file one by one
    for (const file of listed.Contents) {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: S3_BUCKET,
          Key: file.Key,
        })
      );
      console.log("Deleted S3 File:", file.Key);
    }

    console.log("Folder deleted:", prefix);
  } catch (err) {
    console.error("❌ Error while deleting S3 folder:", err);
  }
};

/*********************************************
 * DELETE ENDPOINT
 * DELETE /api/admin/mocktests/:mockTestId
 *********************************************/
router.delete("/:mockTestId", async (req, res) => {
  try {
    const { mockTestId } = req.params;

    if (!mockTestId) {
      return res.status(400).json({ error: "mockTestId is required" });
    }

    console.log("Deleting MockTest:", mockTestId);

    /*******************************
     * 1️⃣ Delete MockTest from DynamoDB
     *******************************/
    await ddb.send(
      new DeleteCommand({
        TableName: MOCKTESTS_TABLE,
        Key: { mockTestId },
      })
    );
    console.log("DynamoDB row deleted");

    /*******************************
     * 2️⃣ Delete S3 folder
     * Path: mocktests/<mockTestId>/
     *******************************/
    const folderPrefix = `mocktests/${mockTestId}/`;
    await deleteS3Folder(folderPrefix);

    return res.json({
      success: true,
      message: "MockTest deleted from DynamoDB and S3",
    });

  } catch (err) {
    console.error("❌ Delete MockTest Error:", err);
    return res.status(500).json({ error: "Failed to delete mock test" });
  }
});

module.exports = router;
