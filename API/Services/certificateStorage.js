const fs = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({ region: "ap-south-1" });
const BUCKET = process.env.CERTIFICATES_BUCKET;

async function uploadCertificate({ filePath, userSub, courseId }) {
  const key = `certificates/${userSub}/${courseId}.pdf`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: fs.createReadStream(filePath),
      ContentType: "application/pdf",
    })
  );

  return key;
}

module.exports = { uploadCertificate };
