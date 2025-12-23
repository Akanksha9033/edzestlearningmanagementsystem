const express = require("express");
const router = express.Router();

const path = require("path");
const mime = require("mime-types");
const { v4: uuid } = require("uuid");
const stream = require("stream");
const { authAccess, requireRoles } = require("../../../../../middleware/auth");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const {
  S3Client,
  GetObjectCommand,
  ListObjectsV2Command,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  HeadBucketCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

/* -------------------- S3 client -------------------- */
// Supports either AWS_REGION or S3_REGION, and S3_BUCKET_NAME or S3_BUCKET
const IS_LOCAL = process.env.NODE_ENV !== "production";

const REGION = process.env.AWS_REGION || process.env.S3_REGION;
const BUCKET = process.env.S3_BUCKET_NAME || process.env.S3_BUCKET;

// NEW — Detect local vs Lambda
const IS_LAMBDA = !!process.env.AWS_LAMBDA_FUNCTION_NAME;

// NEW — local dev credentials (Lesson.js style)
const ACCESS = process.env.AWS_ACCESS_KEY_ID;
const SECRET = process.env.AWS_SECRET_ACCESS_KEY;

if (!REGION || !BUCKET) {
  console.error("❌ Missing AWS_REGION/S3_REGION or S3_BUCKET_NAME/S3_BUCKET in .env");
}

// NEW — SAFE S3 client config
const s3Config = {
  region: REGION,
  credentials: IS_LAMBDA
    ? undefined // Lambda → IAM role automatically
    : (ACCESS && SECRET ? {
        accessKeyId: ACCESS,
        secretAccessKey: SECRET,
      } : undefined),
};

const s3 = new S3Client(s3Config);

/* -------------------- helpers -------------------- */
function inferContentType(key) {
  const ext = String(key).split(".").pop()?.toLowerCase();
  if (ext === "m3u8") return "application/vnd.apple.mpegurl";
  if (ext === "mp3") return "audio/mpeg";
  return mime.lookup(ext || "") || "video/mp4";
}

/* ------------------------------------------------------------------
   Debug
------------------------------------------------------------------- */
router.get("/debug", async (_req, res) => {
  try {
    console.log("[DEBUG] BUCKET:", BUCKET, "REGION:", REGION);
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
    res.json({ ok: true, bucket: BUCKET, region: REGION });
  } catch (e) {
    console.error("[DEBUG ERROR]", e);
    res.status(500).json({
      ok: false,
      bucket: BUCKET,
      region: REGION,
      name: e.name,
      message: e.message,
    });
  }
});

/* ------------------------------------------------------------------
   List objects
------------------------------------------------------------------- */
router.get("/list", async (req, res) => {
  try {
    const prefix = String(req.query.prefix || "");
    const out = await s3.send(
      new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix })
    );
    const items = (out.Contents || [])
      .filter((o) => o.Key && !o.Key.endsWith("/"))
      .map((o) => ({
        key: o.Key,
        size: o.Size,
        lastModified: o.LastModified,
      }));
    res.json({ items });
  } catch (e) {
    console.error("[LIST ERROR]", e);
    res.status(500).json({ error: "Failed to list objects", detail: e.message });
  }
});

/* ------------------------------------------------------------------
   Sign GET (playback URL)
------------------------------------------------------------------- */
router.get("/sign", async (req, res) => {
  try {
    const key = String(req.query.key || "");
    if (!key) return res.status(400).json({ error: "key is required" });

    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ResponseContentDisposition: "inline",
      ResponseContentType: inferContentType(key),
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    res.json({ url, key, expiresIn: 3600 });
  } catch (e) {
    console.error("[SIGN ERROR]", e);
    res.status(500).json({ error: "Failed to sign URL", detail: e.message });
  }
});

/* ------------------------------------------------------------------
   Stream proxy (for TrackedVideo)
------------------------------------------------------------------- */
router.get("/stream", async (req, res) => {
  try {
    const key = String(req.query.key || "");
    if (!key) return res.status(400).send("key required");
    if (!BUCKET) return res.status(500).send("S3_BUCKET missing");

    console.log("[STREAM] key:", key);

    const range = req.headers.range;
    const params = { Bucket: BUCKET, Key: key };
    if (range) {
      params.Range = range; // e.g. "bytes=0-"
    }

    const cmd = new GetObjectCommand(params);
    const data = await s3.send(cmd);

    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Range, Content-Type, Authorization"
    );
    res.setHeader(
      "Access-Control-Expose-Headers",
      "Content-Length, Content-Range"
    );

    if (range && data.ContentRange) {
      res.status(206); // Partial content
      res.setHeader("Content-Range", data.ContentRange);
    }

    res.setHeader("Content-Type", data.ContentType || "video/mp4");
    res.setHeader("Accept-Ranges", "bytes");

    data.Body.pipe(res);
  } catch (e) {
    console.error("[STREAM ERROR]", e);
    res.status(500).json({ error: "Stream failed", detail: e.message });
  }
});

/* ====================== Multipart Upload ====================== */
router.post("/create-multipart", async (req, res) => {
  try {
    const { filename, contentType, folder } = req.body || {};
    if (!filename) return res.status(400).json({ error: "filename required" });
    if (!BUCKET) return res.status(500).json({ error: "S3_BUCKET missing" });

    const ext =
      path.extname(filename) ||
      "." + (mime.extension(contentType || "") || "bin");

    const safeFolder = folder ? String(folder).replace(/\/+$/g, "") + "/" : "";
    const key = `${safeFolder}${Date.now()}-${uuid()}${ext}`;

    const params = {
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType || "application/octet-stream",
    };

    const out = await s3.send(new CreateMultipartUploadCommand(params));
    res.json({ key, uploadId: out.UploadId });
  } catch (e) {
    console.error("[CREATE-MULTIPART ERROR]", e);
    res.status(500).json({ error: "Failed to create multipart upload", detail: e.message });
  }
});

router.get("/sign-part", async (req, res) => {
  try {
    const { key, uploadId, partNumber } = req.query || {};
    if (!key || !uploadId || !partNumber) {
      return res.status(400).json({ error: "key, uploadId, partNumber required" });
    }
    const cmd = new UploadPartCommand({
      Bucket: BUCKET,
      Key: String(key),
      UploadId: String(uploadId),
      PartNumber: Number(partNumber),
    });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 600 });
    res.json({ url });
  } catch (e) {
    console.error("[SIGN-PART ERROR]", e);
    res.status(500).json({ error: "Failed to sign part", detail: e.message });
  }
});

router.post("/complete-multipart", async (req, res) => {
  try {
    const { key, uploadId, parts } = req.body || {};
    if (!key || !uploadId || !Array.isArray(parts)) {
      return res.status(400).json({ error: "key, uploadId, parts required" });
    }
    const out = await s3.send(
      new CompleteMultipartUploadCommand({
        Bucket: BUCKET,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts },
      })
    );
    res.json({ ok: true, key, location: out.Location || null });
  } catch (e) {
    console.error("[COMPLETE-MULTIPART ERROR]", e);
    res.status(500).json({ error: "Failed to complete upload", detail: e.message });
  }
});

router.post("/abort-multipart", async (req, res) => {
  try {
    const { key, uploadId } = req.body || {};
    if (!key || !uploadId) {
      return res.status(400).json({ error: "key and uploadId required" });
    }
    await s3.send(
      new AbortMultipartUploadCommand({
        Bucket: BUCKET,
        Key: key,
        UploadId: uploadId,
      })
    );
    res.json({ ok: true });
  } catch (e) {
    console.error("[ABORT-MULTIPART ERROR]", e);
    res.status(500).json({ error: "Failed to abort upload", detail: e.message });
  }
});

/* ====================== New routes for frontend ====================== */
router.post("/presignPut", async (req, res) => {
  try {
    const { filename, contentType, folder } = req.body;
    console.log("[presignPut] body:", req.body);
    console.log("[presignPut] BUCKET:", BUCKET, "REGION:", REGION);

    if (!filename) return res.status(400).json({ error: "filename required" });
    if (!BUCKET) return res.status(500).json({ error: "S3_BUCKET missing" });

    const safeFolder = folder ? String(folder).replace(/\/+$/g, "") + "/" : "";
    const key = `${safeFolder}${Date.now()}-${uuid()}-${filename}`;
    console.log("[presignPut] key:", key);

    const cmd = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType || "application/octet-stream",
    });

    const url = await getSignedUrl(s3, cmd, { expiresIn: 3600 });
    res.json({ url, key });
  } catch (e) {
    console.error("[presignPut ERROR]", e);
    res.status(500).json({
      error: "Failed to presign",
      detail: e.message,
      name: e.name,
      code: e.$metadata?.httpStatusCode,
    });
  }
});

router.post("/upload-direct", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "file missing" });
    if (!BUCKET) return res.status(500).json({ error: "S3_BUCKET missing" });

    const folder = req.body.folder || "uploads";
    const key = `${folder}/${Date.now()}-${uuid()}-${req.file.originalname}`;
    console.log("[upload-direct] key:", key);

    const cmd = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    });

    await s3.send(cmd);

    // ⭐⭐⭐ LOCAL AUTO-HLS (FAKE FOR DEV)
if (IS_LOCAL && req.file.mimetype.startsWith("video/")) {
  console.log("🧪 LOCAL MODE: assuming HLS ready for", key);

  // yahan frontend ko HLS path mil jayega
  return res.json({
    key,
    hlsKey: "hls/index.m3u8",
  });
}

// default response
    res.json({ key });
  } catch (e) {
    console.error("[upload-direct ERROR]", e);
    res.status(500).json({
      error: "Upload failed",
      detail: e.message,
      name: e.name,
      code: e.$metadata?.httpStatusCode,
    });
  }
});

router.post(
  "/save-text",
  authAccess,
  requireRoles(["Admin","Teacher"]),
  async (req, res) => {
    try {
      const { folder, content, filename = "link.txt" } = req.body || {};
      if (!content) return res.status(400).json({ message: "content required" });

      const safeFolder = (folder || "lessons").replace(/\/+$/,"");
      const safeName = String(filename || "link.txt").replace(/[^\w.\-]/g, "_");

      const key = `${safeFolder}/${uuid()}-${safeName}`;

      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: Buffer.from(String(content), "utf8"),
        ContentType: "text/plain; charset=utf-8",
      }));

      res.json({ key });
    } catch (err) {
      console.error("❌ save-text error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
