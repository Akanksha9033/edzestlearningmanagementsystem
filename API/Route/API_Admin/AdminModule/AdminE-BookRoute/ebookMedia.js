// backend/routes/ebookMedia.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const router = express.Router();

/* ---- ENV ---- */
const REGION = process.env.AWS_REGION || "ap-south-1";
const BUCKET = process.env.S3_BUCKET;
const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID;
const SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY;

// Optional: if you later put CloudFront in front of S3, set this to your dist domain (e.g. dxxx.cloudfront.net)
const CDN_DOMAIN = process.env.CDN_DOMAIN || "";

/* ---- Checks ---- */
if (!BUCKET) console.warn("[ebookMedia] Missing S3_BUCKET");
if (!ACCESS_KEY || !SECRET_KEY) console.warn("[ebookMedia] Missing AWS creds");

/* ---- S3 Client ---- */
const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
});

/* ---- Multer: memory storage ---- */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only images (png, jpg, jpeg, gif, webp) are allowed"));
    }
    cb(null, true);
  },
});

/* ---- Health check ---- */
router.get("/health", (_req, res) => {
  res.json({
    ok: true,
    region: REGION,
    bucket: BUCKET || "(missing)",
  });
});

/* ---- Upload image ---- */
router.post("/upload-image", upload.single("file"), async (req, res) => {
  try {
    if (!BUCKET) {
      return res.status(500).json({ error: "S3_BUCKET env var not set on server" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const ext = (path.extname(req.file.originalname || "") || ".jpg").toLowerCase();
    const key = `ebooks/${uuidv4()}${ext}`;

    // IMPORTANT: do NOT set ACL when bucket has ACLs disabled
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype || "application/octet-stream",
        // ACL: "public-read"  // ❌ remove this (causes AccessControlListNotSupported)
      })
    );

    // If you’ve set a public-read bucket policy, this S3 URL will be publicly readable:
    const s3Url = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
    const url = CDN_DOMAIN ? `https://${CDN_DOMAIN}/${key}` : s3Url;

    res.json({ url, key, bucket: BUCKET, region: REGION });
  } catch (err) {
    console.error("[ebookMedia] upload error:", err);
    res.status(500).json({
      error: "Failed to upload image",
      details: err.message || String(err),
      code: err.name || "UploadError",
    });
  }
});

module.exports = router;
