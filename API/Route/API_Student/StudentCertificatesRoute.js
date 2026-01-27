console.log("🔥 StudentCertificatesRoute LOADED");

const express = require("express");
const router = express.Router();

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");

const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const { authAccess } = require("../../middleware/auth");

/* ================= AWS ================= */
const REGION = process.env.AWS_REGION || "ap-south-1";
const CERT_TABLE = process.env.CERTIFICATES_TABLE || "Certificates";
const CERT_BUCKET = process.env.CERTIFICATES_BUCKET || "edzest-certificates";

console.log("🧪 [CERT] REGION =", REGION);
console.log("🧪 [CERT] TABLE =", CERT_TABLE);
console.log("🧪 [CERT] BUCKET =", CERT_BUCKET);

const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: REGION })
);
const s3 = new S3Client({ region: REGION });

/* =========================================================
   GET: Student Certificates
   ========================================================= */
router.get("/student/certificates", authAccess, async (req, res) => {
  try {
    const studentSub = req.user?.sub;

    console.log("🧾 [CERT API] Request by:", studentSub);

    if (!studentSub) {
      console.warn("❌ [CERT API] Missing studentSub");
      return res.status(401).json({ message: "Unauthorized" });
    }

    const pk = `USER#${studentSub}`;

    console.log("🔍 [CERT API] Query PK:", pk);

    const out = await ddb.send(
      new QueryCommand({
        TableName: CERT_TABLE,
        KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :sk)",
        ExpressionAttributeNames: {
          "#pk": "pk",
          "#sk": "sk",
        },
        ExpressionAttributeValues: {
          ":pk": pk,
          ":sk": "CERT#",
        },
        ScanIndexForward: false,
      })
    );

    const items = out.Items || [];
    console.log("📦 [CERT API] Items found:", items.length);

    const withUrls = await Promise.all(
      items.map(async (it) => {
        if (!it?.s3Key) {
          console.warn("⚠️ [CERT API] Missing s3Key:", it);
          return { ...it, downloadUrl: null };
        }

        console.log("☁️ [CERT API] Signing URL for:", it.s3Key);

        const url = await getSignedUrl(
          s3,
          new GetObjectCommand({
            Bucket: CERT_BUCKET,
            Key: it.s3Key,
          }),
          { expiresIn: 600 }
        );

        return { ...it, downloadUrl: url };
      })
    );

    console.log("✅ [CERT API] Returning certificates");
    res.json({ items: withUrls });
  } catch (err) {
    console.error("❌ [CERT API] ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
