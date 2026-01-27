const express = require("express");
const router = express.Router();
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

const REGION = process.env.AWS_REGION || "ap-south-1";
const CERT_BUCKET = process.env.CERTIFICATE_BUCKET || "edzest-certificates";

const s3 = new S3Client({ region: REGION });

router.get("/certificate/:userId/:courseSlug", async (req, res) => {
  try {
    const { userId, courseSlug } = req.params;

    console.log("⬇️ [CERT DOWNLOAD]", { userId, courseSlug });

    const Key = `certificates/${userId}/${courseSlug}.pdf`;

    const data = await s3.send(
      new GetObjectCommand({
        Bucket: CERT_BUCKET,
        Key,
      })
    );

    // 🔥 THIS IS THE MAGIC
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${courseSlug}-certificate.pdf"`
    );
    res.setHeader("Content-Type", "application/pdf");

    data.Body.pipe(res);
  } catch (err) {
    console.error("❌ [CERT DOWNLOAD ERROR]", err);
    res.status(404).send("Certificate not found");
  }
});

module.exports = router;
