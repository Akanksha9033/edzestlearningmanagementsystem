// backend/routes/ebookMedia.js

// ⭐ Express router for handling e-book related image uploads
const express = require("express");
const multer = require("multer");              // handles file uploads (memory storage)
const path = require("path");                  // helps in extracting file extensions
const { v4: uuidv4 } = require("uuid");        // generates a random unique id for file naming
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3"); // AWS SDK v3 for S3 upload

const router = express.Router();

/* ------------------------------------------------------------------
   🔧 ENVIRONMENT VARIABLES
   These come from your Lambda or local .env file
------------------------------------------------------------------- */
const REGION = process.env.AWS_REGION || "ap-south-1";  // AWS region
const BUCKET = process.env.S3_BUCKET;                   // S3 bucket name
const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID;       // Local Dev AWS access key
const SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY;   // Local Dev AWS secret key

// Optional CloudFront CDN domain — used when you want image URLs to load faster
const CDN_DOMAIN = process.env.CDN_DOMAIN || "";

/* ------------------------------------------------------------------
   ⚠️ RUN-TIME CHECKS (Just warnings, NOT errors)
------------------------------------------------------------------- */
if (!BUCKET) console.warn("[ebookMedia] Missing S3_BUCKET");
if (!ACCESS_KEY || !SECRET_KEY) console.warn("[ebookMedia] Missing AWS creds");

/* ------------------------------------------------------------------
   📦 CREATE S3 CLIENT (AWS SDK v3)
   - In local environment: uses ACCESS + SECRET
   - In Lambda: Always prefer IAM Role (but here we are using ACCESS_KEY)
------------------------------------------------------------------- */
const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
});

/* ------------------------------------------------------------------
   📁 Multer memory storage
   - File uploaded is stored in RAM, not saved on disk
   - File limit 10MB
   - Only allow images: png, jpg, jpeg, gif, webp
------------------------------------------------------------------- */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only images (png, jpg, jpeg, gif, webp) are allowed"));
    }
    cb(null, true);
  },
});

/* ------------------------------------------------------------------
   ❤️ Health Check Endpoint
   Helps you verify if:
     - Server is running
     - Region is correct
     - Bucket name is passing correctly
------------------------------------------------------------------- */
router.get("/health", (_req, res) => {
  res.json({
    ok: true,
    region: REGION,
    bucket: BUCKET || "(missing)",
  });
});

/* ------------------------------------------------------------------
   📤 UPLOAD IMAGE ENDPOINT
   POST /upload-image
   - Receives a file in "file" field
   - Saves it in S3 bucket inside "ebooks/" folder
   - Returns public URL of uploaded file
------------------------------------------------------------------- */
router.post("/upload-image", upload.single("file"), async (req, res) => {
  try {
    // Validate environment and file presence
    if (!BUCKET) {
      return res.status(500).json({ error: "S3_BUCKET env var not set on server" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Extract file extension
    const ext = (path.extname(req.file.originalname || "") || ".jpg").toLowerCase();

    // Create a unique filename in S3 -> ebooks/<unique-id>.ext
    const key = `ebooks/${uuidv4()}${ext}`;

    // ⭐ Upload to S3 using AWS SDK v3
    // NOTE: We do NOT set ACL because ACLs are disabled by default in S3
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype || "application/octet-stream",
        // ACL: "public-read"  // ❌ Do not enable ACL
      })
    );

    // ⭐ Build public URL — if CDN domain exists use that, else S3 URL
    const s3Url = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
    const url = CDN_DOMAIN ? `https://${CDN_DOMAIN}/${key}` : s3Url;

    // Return success response
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

// Export router
module.exports = router;
