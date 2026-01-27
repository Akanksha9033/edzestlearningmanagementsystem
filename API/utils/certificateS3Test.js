const fs = require("fs");
const path = require("path");

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

/* ================= CONFIG ================= */
const REGION = process.env.AWS_REGION || "ap-south-1";
const BUCKET = process.env.CERTIFICATES_BUCKET || "edzest-certificates";

const s3 = new S3Client({ region: REGION });

async function uploadTestCertificate() {
  const filePath = path.join(__dirname, "..", "test-certificate.pdf");

  if (!fs.existsSync(filePath)) {
    console.error("❌ test-certificate.pdf not found");
    return;
  }

  const fileBuffer = fs.readFileSync(filePath);

  const s3Key = `certificates/test-user/test-course.pdf`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: s3Key,
    Body: fileBuffer,
    ContentType: "application/pdf",
  });

  await s3.send(command);

  console.log("✅ Uploaded certificate to S3");
  console.log(`📦 Bucket: ${BUCKET}`);
  console.log(`🔑 Key: ${s3Key}`);
}

uploadTestCertificate().catch(console.error);
