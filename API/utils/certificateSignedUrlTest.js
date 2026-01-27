const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const REGION = process.env.AWS_REGION || "ap-south-1";
const BUCKET = process.env.CERTIFICATES_BUCKET || "edzest-certificates";

const s3 = new S3Client({ region: REGION });

async function generateSignedUrl() {
  const s3Key = "certificates/test-user/test-course.pdf";

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: s3Key,
  });

  const signedUrl = await getSignedUrl(s3, command, {
    expiresIn: 60 * 5, // 5 minutes
  });

  console.log("✅ Signed URL generated:");
  console.log(signedUrl);
}

generateSignedUrl().catch(console.error);
