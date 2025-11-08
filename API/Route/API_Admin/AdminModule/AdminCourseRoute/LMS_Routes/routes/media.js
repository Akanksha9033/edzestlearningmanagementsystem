// // backend/routes/media.js
// const express = require("express");
// const router = express.Router();

// const path = require("path");
// const mime = require("mime-types");
// const { v4: uuid } = require("uuid");
// const stream = require("stream");

// const multer = require("multer");
// const upload = multer({ storage: multer.memoryStorage() });

// const {
//   S3Client,
//   GetObjectCommand,
//   ListObjectsV2Command,
//   CreateMultipartUploadCommand,
//   UploadPartCommand,
//   CompleteMultipartUploadCommand,
//   AbortMultipartUploadCommand,
//   HeadBucketCommand,
//   PutObjectCommand,
// } = require("@aws-sdk/client-s3");
// const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// /* -------------------- S3 client -------------------- */
// const REGION = process.env.AWS_REGION || process.env.S3_REGION;
// const BUCKET = process.env.S3_BUCKET_NAME || process.env.S3_BUCKET;

// if (!REGION || !BUCKET) {
//   console.error("❌ Missing AWS_REGION/S3_REGION or S3_BUCKET_NAME/S3_BUCKET in .env");
// }

// const s3Config = { region: REGION };
// if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
//   s3Config.credentials = {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   };
// }
// const s3 = new S3Client(s3Config);

// /* -------------------- helpers -------------------- */
// function inferContentType(key) {
//   const ext = String(key).split(".").pop()?.toLowerCase();
//   if (ext === "m3u8") return "application/vnd.apple.mpegurl";
//   if (ext === "mp3") return "audio/mpeg";
//   return mime.lookup(ext || "") || "video/mp4";
// }

// /* ------------------------------------------------------------------
//    Debug
// ------------------------------------------------------------------- */
// router.get("/debug", async (_req, res) => {
//   try {
//     console.log("[DEBUG] BUCKET:", BUCKET, "REGION:", REGION);
//     await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
//     res.json({ ok: true, bucket: BUCKET, region: REGION });
//   } catch (e) {
//     console.error("[DEBUG ERROR]", e);
//     res.status(500).json({
//       ok: false,
//       bucket: BUCKET,
//       region: REGION,
//       name: e.name,
//       message: e.message,
//     });
//   }
// });

// /* ------------------------------------------------------------------
//    List objects
// ------------------------------------------------------------------- */
// router.get("/list", async (req, res) => {
//   try {
//     const prefix = String(req.query.prefix || "");
//     const out = await s3.send(
//       new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix })
//     );
//     const items = (out.Contents || [])
//       .filter((o) => o.Key && !o.Key.endsWith("/"))
//       .map((o) => ({
//         key: o.Key,
//         size: o.Size,
//         lastModified: o.LastModified,
//       }));
//     res.json({ items });
//   } catch (e) {
//     console.error("[LIST ERROR]", e);
//     res.status(500).json({ error: "Failed to list objects", detail: e.message });
//   }
// });

// /* ------------------------------------------------------------------
//    Sign GET (playback URL)
// ------------------------------------------------------------------- */
// router.get("/sign", async (req, res) => {
//   try {
//     const key = String(req.query.key || "");
//     if (!key) return res.status(400).json({ error: "key is required" });

//     const command = new GetObjectCommand({
//       Bucket: BUCKET,
//       Key: key,
//       ResponseContentDisposition: "inline",
//       ResponseContentType: inferContentType(key),
//     });

//     const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
//     res.json({ url, key, expiresIn: 3600 });
//   } catch (e) {
//     console.error("[SIGN ERROR]", e);
//     res.status(500).json({ error: "Failed to sign URL", detail: e.message });
//   }
// });

// /* ------------------------------------------------------------------
//    Stream proxy (for TrackedVideo)
// ------------------------------------------------------------------- */
// router.get("/stream", async (req, res) => {
//   try {
//     const key = String(req.query.key || "");
//     if (!key) return res.status(400).send("key required");
//     if (!BUCKET) return res.status(500).send("S3_BUCKET missing");

//     console.log("[STREAM] key:", key);

//     const range = req.headers.range;
//     const params = { Bucket: BUCKET, Key: key };
//     if (range) params.Range = range;

//     const data = await s3.send(new GetObjectCommand(params));

//     // ✅ CORS headers
//     res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
//     res.setHeader("Access-Control-Allow-Credentials", "true");
//     res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Range");
//     res.setHeader("Access-Control-Expose-Headers", "Accept-Ranges, Content-Range, Content-Length");

//     res.setHeader("Content-Type", data.ContentType || "video/mp4");
//     res.setHeader("Accept-Ranges", "bytes");

//     if (data.ContentRange) {
//       res.setHeader("Content-Range", data.ContentRange);
//       if (data.ContentLength) res.setHeader("Content-Length", String(data.ContentLength));
//       res.status(206); // Partial content
//     } else {
//       if (data.ContentLength) res.setHeader("Content-Length", String(data.ContentLength));
//       res.status(200);
//     }

//     data.Body.pipe(res);
//   } catch (e) {
//     console.error("[STREAM ERROR]", e);
//     res.status(500).json({ error: "Stream failed", detail: e.message });
//   }
// });

// /* ====================== Multipart Upload ====================== */
// router.post("/create-multipart", async (req, res) => {
//   try {
//     const { filename, contentType, folder } = req.body || {};
//     if (!filename) return res.status(400).json({ error: "filename required" });
//     if (!BUCKET) return res.status(500).json({ error: "S3_BUCKET missing" });

//     const ext =
//       path.extname(filename) ||
//       "." + (mime.extension(contentType || "") || "bin");

//     const safeFolder = folder ? String(folder).replace(/\/+$/g, "") + "/" : "";
//     const key = `${safeFolder}${Date.now()}-${uuid()}${ext}`;

//     const params = {
//       Bucket: BUCKET,
//       Key: key,
//       ContentType: contentType || "application/octet-stream",
//     };

//     const out = await s3.send(new CreateMultipartUploadCommand(params));
//     res.json({ key, uploadId: out.UploadId });
//   } catch (e) {
//     console.error("[CREATE-MULTIPART ERROR]", e);
//     res.status(500).json({ error: "Failed to create multipart upload", detail: e.message });
//   }
// });

// router.get("/sign-part", async (req, res) => {
//   try {
//     const { key, uploadId, partNumber } = req.query || {};
//     if (!key || !uploadId || !partNumber) {
//       return res.status(400).json({ error: "key, uploadId, partNumber required" });
//     }
//     const cmd = new UploadPartCommand({
//       Bucket: BUCKET,
//       Key: String(key),
//       UploadId: String(uploadId),
//       PartNumber: Number(partNumber),
//     });
//     const url = await getSignedUrl(s3, cmd, { expiresIn: 600 });
//     res.json({ url });
//   } catch (e) {
//     console.error("[SIGN-PART ERROR]", e);
//     res.status(500).json({ error: "Failed to sign part", detail: e.message });
//   }
// });

// router.post("/complete-multipart", async (req, res) => {
//   try {
//     const { key, uploadId, parts } = req.body || {};
//     if (!key || !uploadId || !Array.isArray(parts)) {
//       return res.status(400).json({ error: "key, uploadId, parts required" });
//     }
//     const out = await s3.send(
//       new CompleteMultipartUploadCommand({
//         Bucket: BUCKET,
//         Key: key,
//         UploadId: uploadId,
//         MultipartUpload: { Parts: parts },
//       })
//     );
//     res.json({ ok: true, key, location: out.Location || null });
//   } catch (e) {
//     console.error("[COMPLETE-MULTIPART ERROR]", e);
//     res.status(500).json({ error: "Failed to complete upload", detail: e.message });
//   }
// });

// router.post("/abort-multipart", async (req, res) => {
//   try {
//     const { key, uploadId } = req.body || {};
//     if (!key || !uploadId) {
//       return res.status(400).json({ error: "key and uploadId required" });
//     }
//     await s3.send(
//       new AbortMultipartUploadCommand({
//         Bucket: BUCKET,
//         Key: key,
//         UploadId: uploadId,
//       })
//     );
//     res.json({ ok: true });
//   } catch (e) {
//     console.error("[ABORT-MULTIPART ERROR]", e);
//     res.status(500).json({ error: "Failed to abort upload", detail: e.message });
//   }
// });

// /* ====================== New routes for frontend ====================== */
// router.post("/presignPut", async (req, res) => {
//   try {
//     const { filename, contentType, folder } = req.body;
//     console.log("[presignPut] body:", req.body);
//     console.log("[presignPut] BUCKET:", BUCKET, "REGION:", REGION);

//     if (!filename) return res.status(400).json({ error: "filename required" });
//     if (!BUCKET) return res.status(500).json({ error: "S3_BUCKET missing" });

//     const safeFolder = folder ? String(folder).replace(/\/+$/g, "") + "/" : "";
//     const key = `${safeFolder}${Date.now()}-${uuid()}-${filename}`;
//     console.log("[presignPut] key:", key);

//     const cmd = new PutObjectCommand({
//       Bucket: BUCKET,
//       Key: key,
//       ContentType: contentType || "application/octet-stream",
//     });

//     const url = await getSignedUrl(s3, cmd, { expiresIn: 3600 });
//     res.json({ url, key });
//   } catch (e) {
//     console.error("[presignPut ERROR]", e);
//     res.status(500).json({
//       error: "Failed to presign",
//       detail: e.message,
//       name: e.name,
//       code: e.$metadata?.httpStatusCode,
//     });
//   }
// });

// router.post("/upload-direct", upload.single("file"), async (req, res) => {
//   try {
//     if (!req.file) return res.status(400).json({ error: "file missing" });
//     if (!BUCKET) return res.status(500).json({ error: "S3_BUCKET missing" });

//     const folder = req.body.folder || "uploads";
//     const key = `${folder}/${Date.now()}-${uuid()}-${req.file.originalname}`;
//     console.log("[upload-direct] key:", key);

//     const cmd = new PutObjectCommand({
//       Bucket: BUCKET,
//       Key: key,
//       Body: req.file.buffer,
//       ContentType: req.file.mimetype,
//     });

//     await s3.send(cmd);
//     res.json({ key });
//   } catch (e) {
//     console.error("[upload-direct ERROR]", e);
//     res.status(500).json({
//       error: "Upload failed",
//       detail: e.message,
//       name: e.name,
//       code: e.$metadata?.httpStatusCode,
//     });
//   }
// });

// module.exports = router;


































































// backend/routes/media.js

// const express = require("express");
// const router = express.Router();

// const path = require("path");
// const mime = require("mime-types");
// const { v4: uuid } = require("uuid");
// const stream = require("stream");

// const multer = require("multer");
// const upload = multer({ storage: multer.memoryStorage() });

// const {
//   S3Client,
//   GetObjectCommand,
//   ListObjectsV2Command,
//   CreateMultipartUploadCommand,
//   UploadPartCommand,
//   CompleteMultipartUploadCommand,
//   AbortMultipartUploadCommand,
//   HeadBucketCommand,
//   PutObjectCommand,
// } = require("@aws-sdk/client-s3");
// const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// /* -------------------- S3 client -------------------- */
// // Supports either AWS_REGION or S3_REGION, and S3_BUCKET_NAME or S3_BUCKET
// const REGION = process.env.AWS_REGION || process.env.S3_REGION;
// const BUCKET = process.env.S3_BUCKET_NAME || process.env.S3_BUCKET;

// if (!REGION || !BUCKET) {
//   console.error("❌ Missing AWS_REGION/S3_REGION or S3_BUCKET_NAME/S3_BUCKET in .env");
// }

// const s3Config = { region: REGION };
// if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
//   s3Config.credentials = {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   };
// }
// const s3 = new S3Client(s3Config);

// /* -------------------- helpers -------------------- */
// function inferContentType(key) {
//   const ext = String(key).split(".").pop()?.toLowerCase();
//   if (ext === "m3u8") return "application/vnd.apple.mpegurl";
//   if (ext === "mp3") return "audio/mpeg";
//   return mime.lookup(ext || "") || "video/mp4";
// }

// /* ------------------------------------------------------------------
//    Debug
// ------------------------------------------------------------------- */
// router.get("/debug", async (_req, res) => {
//   try {
//     console.log("[DEBUG] BUCKET:", BUCKET, "REGION:", REGION);
//     await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
//     res.json({ ok: true, bucket: BUCKET, region: REGION });
//   } catch (e) {
//     console.error("[DEBUG ERROR]", e);
//     res.status(500).json({
//       ok: false,
//       bucket: BUCKET,
//       region: REGION,
//       name: e.name,
//       message: e.message,
//     });
//   }
// });

// /* ------------------------------------------------------------------
//    List objects
// ------------------------------------------------------------------- */
// router.get("/list", async (req, res) => {
//   try {
//     const prefix = String(req.query.prefix || "");
//     const out = await s3.send(
//       new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix })
//     );
//     const items = (out.Contents || [])
//       .filter((o) => o.Key && !o.Key.endsWith("/"))
//       .map((o) => ({
//         key: o.Key,
//         size: o.Size,
//         lastModified: o.LastModified,
//       }));
//     res.json({ items });
//   } catch (e) {
//     console.error("[LIST ERROR]", e);
//     res.status(500).json({ error: "Failed to list objects", detail: e.message });
//   }
// });

// /* ------------------------------------------------------------------
//    Sign GET (playback URL)
// ------------------------------------------------------------------- */
// router.get("/sign", async (req, res) => {
//   try {
//     const key = String(req.query.key || "");
//     if (!key) return res.status(400).json({ error: "key is required" });

//     const command = new GetObjectCommand({
//       Bucket: BUCKET,
//       Key: key,
//       ResponseContentDisposition: "inline",
//       ResponseContentType: inferContentType(key),
//     });

//     const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
//     res.json({ url, key, expiresIn: 3600 });
//   } catch (e) {
//     console.error("[SIGN ERROR]", e);
//     res.status(500).json({ error: "Failed to sign URL", detail: e.message });
//   }
// });

// /* ------------------------------------------------------------------
//    Stream proxy (for TrackedVideo)
// ------------------------------------------------------------------- */
// router.get("/stream", async (req, res) => {
//   try {
//     const key = String(req.query.key || "");
//     if (!key) return res.status(400).send("key required");
//     if (!BUCKET) return res.status(500).send("S3_BUCKET missing");

//     console.log("[STREAM] key:", key);

//     const cmd = new GetObjectCommand({
//       Bucket: BUCKET,
//       Key: key,
//     });

//     const data = await s3.send(cmd);

//     res.setHeader("Content-Type", data.ContentType || "video/mp4");
//     res.setHeader("Accept-Ranges", "bytes");

//     const passThrough = new stream.PassThrough();
//     data.Body.pipe(passThrough).pipe(res);
//   } catch (e) {
//     console.error("[STREAM ERROR]", e);
//     res.status(500).json({ error: "Stream failed", detail: e.message });
//   }
// });

// /* ====================== Multipart Upload ====================== */
// router.post("/create-multipart", async (req, res) => {
//   try {
//     const { filename, contentType, folder } = req.body || {};
//     if (!filename) return res.status(400).json({ error: "filename required" });
//     if (!BUCKET) return res.status(500).json({ error: "S3_BUCKET missing" });

//     const ext =
//       path.extname(filename) ||
//       "." + (mime.extension(contentType || "") || "bin");

//     const safeFolder = folder ? String(folder).replace(/\/+$/g, "") + "/" : "";
//     const key = `${safeFolder}${Date.now()}-${uuid()}${ext}`;

//     const params = {
//       Bucket: BUCKET,
//       Key: key,
//       ContentType: contentType || "application/octet-stream",
//     };

//     const out = await s3.send(new CreateMultipartUploadCommand(params));
//     res.json({ key, uploadId: out.UploadId });
//   } catch (e) {
//     console.error("[CREATE-MULTIPART ERROR]", e);
//     res.status(500).json({ error: "Failed to create multipart upload", detail: e.message });
//   }
// });

// router.get("/sign-part", async (req, res) => {
//   try {
//     const { key, uploadId, partNumber } = req.query || {};
//     if (!key || !uploadId || !partNumber) {
//       return res.status(400).json({ error: "key, uploadId, partNumber required" });
//     }
//     const cmd = new UploadPartCommand({
//       Bucket: BUCKET,
//       Key: String(key),
//       UploadId: String(uploadId),
//       PartNumber: Number(partNumber),
//     });
//     const url = await getSignedUrl(s3, cmd, { expiresIn: 600 });
//     res.json({ url });
//   } catch (e) {
//     console.error("[SIGN-PART ERROR]", e);
//     res.status(500).json({ error: "Failed to sign part", detail: e.message });
//   }
// });

// router.post("/complete-multipart", async (req, res) => {
//   try {
//     const { key, uploadId, parts } = req.body || {};
//     if (!key || !uploadId || !Array.isArray(parts)) {
//       return res.status(400).json({ error: "key, uploadId, parts required" });
//     }
//     const out = await s3.send(
//       new CompleteMultipartUploadCommand({
//         Bucket: BUCKET,
//         Key: key,
//         UploadId: uploadId,
//         MultipartUpload: { Parts: parts },
//       })
//     );
//     res.json({ ok: true, key, location: out.Location || null });
//   } catch (e) {
//     console.error("[COMPLETE-MULTIPART ERROR]", e);
//     res.status(500).json({ error: "Failed to complete upload", detail: e.message });
//   }
// });

// router.post("/abort-multipart", async (req, res) => {
//   try {
//     const { key, uploadId } = req.body || {};
//     if (!key || !uploadId) {
//       return res.status(400).json({ error: "key and uploadId required" });
//     }
//     await s3.send(
//       new AbortMultipartUploadCommand({
//         Bucket: BUCKET,
//         Key: key,
//         UploadId: uploadId,
//       })
//     );
//     res.json({ ok: true });
//   } catch (e) {
//     console.error("[ABORT-MULTIPART ERROR]", e);
//     res.status(500).json({ error: "Failed to abort upload", detail: e.message });
//   }
// });

// /* ====================== New routes for frontend ====================== */
// router.post("/presignPut", async (req, res) => {
//   try {
//     const { filename, contentType, folder } = req.body;
//     console.log("[presignPut] body:", req.body);
//     console.log("[presignPut] BUCKET:", BUCKET, "REGION:", REGION);

//     if (!filename) return res.status(400).json({ error: "filename required" });
//     if (!BUCKET) return res.status(500).json({ error: "S3_BUCKET missing" });

//     const safeFolder = folder ? String(folder).replace(/\/+$/g, "") + "/" : "";
//     const key = `${safeFolder}${Date.now()}-${uuid()}-${filename}`;
//     console.log("[presignPut] key:", key);

//     const cmd = new PutObjectCommand({
//       Bucket: BUCKET,
//       Key: key,
//       ContentType: contentType || "application/octet-stream",
//     });

//     const url = await getSignedUrl(s3, cmd, { expiresIn: 3600 });
//     res.json({ url, key });
//   } catch (e) {
//     console.error("[presignPut ERROR]", e);
//     res.status(500).json({
//       error: "Failed to presign",
//       detail: e.message,
//       name: e.name,
//       code: e.$metadata?.httpStatusCode,
//     });
//   }
// });

// router.post("/upload-direct", upload.single("file"), async (req, res) => {
//   try {
//     if (!req.file) return res.status(400).json({ error: "file missing" });
//     if (!BUCKET) return res.status(500).json({ error: "S3_BUCKET missing" });

//     const folder = req.body.folder || "uploads";
//     const key = `${folder}/${Date.now()}-${uuid()}-${req.file.originalname}`;
//     console.log("[upload-direct] key:", key);

//     const cmd = new PutObjectCommand({
//       Bucket: BUCKET,
//       Key: key,
//       Body: req.file.buffer,
//       ContentType: req.file.mimetype,
//     });

//     await s3.send(cmd);
//     res.json({ key });
//   } catch (e) {
//     console.error("[upload-direct ERROR]", e);
//     res.status(500).json({
//       error: "Upload failed",
//       detail: e.message,
//       name: e.name,
//       code: e.$metadata?.httpStatusCode,
//     });
//   }
// });

// module.exports = router;





// backend/routes/media.js
const express = require("express");
const router = express.Router();

const path = require("path");
const mime = require("mime-types");
const { v4: uuid } = require("uuid");
const stream = require("stream");
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
  HeadObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

/* -------------------- S3 client -------------------- */
const REGION = process.env.AWS_REGION || process.env.S3_REGION;
const BUCKET = process.env.S3_BUCKET_NAME || process.env.S3_BUCKET;
const SSE = process.env.S3_SSE; // e.g. AES256

if (!REGION || !BUCKET) {
  console.error("❌ Missing AWS_REGION/S3_REGION or S3_BUCKET_NAME/S3_BUCKET in .env");
}

const s3Config = { region: REGION };
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3Config.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}
const s3 = new S3Client(s3Config);

/* -------------------- CORS helpers -------------------- */
const ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS ||
  "http://localhost:3000").split(",").map(s => s.trim()).filter(Boolean);

function setCORS(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  // Let <video> see range headers
  res.setHeader("Access-Control-Expose-Headers", "Content-Range, Accept-Ranges, Content-Length, ETag");
  // Stop Chrome’s “NotSameOrigin” block for media responses
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
}

router.options("*", (req, res) => {
  setCORS(req, res);
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,POST,PUT,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    req.headers["access-control-request-headers"] || "*"
  );
  res.status(204).end();
});

/* -------------------- helpers -------------------- */
function inferContentType(key) {
  const ext = path.extname(String(key)).slice(1).toLowerCase();
  if (ext === "m3u8") return "application/vnd.apple.mpegurl";
  if (ext === "mp3") return "audio/mpeg";
  return mime.lookup(ext || "") || "video/mp4";
}

/* ------------------------------------------------------------------
   Debug
------------------------------------------------------------------- */
router.get("/debug", async (req, res) => {
  try {
    setCORS(req, res);
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
    res.json({ ok: true, bucket: BUCKET, region: REGION, sse: SSE || null, allowedOrigins: ALLOWED_ORIGINS });
  } catch (e) {
    console.error("[DEBUG ERROR]", e);
    res.status(500).json({ ok: false, bucket: BUCKET, region: REGION, name: e.name, message: e.message });
  }
});

/* ------------------------------------------------------------------
   List objects
------------------------------------------------------------------- */
router.get("/list", async (req, res) => {
  try {
    setCORS(req, res);
    const prefix = String(req.query.prefix || "");
    const out = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix }));
    const items = (out.Contents || [])
      .filter((o) => o.Key && !o.Key.endsWith("/"))
      .map((o) => ({ key: o.Key, size: o.Size, lastModified: o.LastModified }));
    res.json({ items });
  } catch (e) {
    console.error("[LIST ERROR]", e);
    res.status(500).json({ error: "Failed to list objects", detail: e.message });
  }
});

/* ------------------------------------------------------------------
   Sign GET (direct S3 playback URL; alternative to /stream)
------------------------------------------------------------------- */
router.get("/sign", async (req, res) => {
  try {
    setCORS(req, res);
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
   Stream proxy (for TrackedVideo) — with proper range + CORP/CORS
------------------------------------------------------------------- */
router.get("/stream", async (req, res) => {
  try {
    setCORS(req, res);
    const key = String(req.query.key || "");
    if (!key) return res.status(400).send("key required");
    if (!BUCKET) return res.status(500).send("S3_BUCKET missing");

    console.log("[STREAM] key:", key);

    // Advertise range support & avoid caching in dev
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "private, no-store");

    // HEAD first to get size & type
    const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    const size = Number(head.ContentLength || 0);
    const contentType = head.ContentType || inferContentType(key);

    let start = 0, end = Math.max(size - 1, 0), status = 200;
    const range = req.headers.range; // e.g. bytes=0-
    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      if (m) {
        if (m[1]) start = parseInt(m[1], 10);
        if (m[2]) end = parseInt(m[2], 10);
        if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || end >= size) {
          return res.status(416).end();
        }
        status = 206;
      }
    }

    const get = await s3.send(new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Range: status === 206 ? `bytes=${start}-${end}` : undefined,
    }));

    res.status(status);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", String(end - start + 1));
    if (status === 206) {
      res.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
    }

    // Let browser see the range headers (also set globally by setCORS)
    res.setHeader("Access-Control-Expose-Headers", "Content-Range, Accept-Ranges, Content-Length, ETag");

    const passThrough = new stream.PassThrough();
    get.Body.pipe(passThrough).pipe(res);
  } catch (e) {
    console.error("[STREAM ERROR]", e);
    res.status(500).json({ error: "Stream failed", detail: e.message });
  }
});

/* ====================== Multipart Upload ====================== */
router.post("/create-multipart", async (req, res) => {
  try {
    setCORS(req, res);
    const { filename, contentType, folder } = req.body || {};
    if (!filename) return res.status(400).json({ error: "filename required" });
    if (!BUCKET) return res.status(500).json({ error: "S3_BUCKET missing" });

    const ext = path.extname(filename) || "." + (mime.extension(contentType || "") || "bin");
    const safeFolder = folder ? String(folder).replace(/\/+$/g, "") + "/" : "";
    const key = `${safeFolder}${Date.now()}-${uuid()}${ext}`;

    const params = {
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType || "application/octet-stream",
      ...(SSE ? { ServerSideEncryption: SSE } : {}),
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
    setCORS(req, res);
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
    setCORS(req, res);
    const { key, uploadId, parts } = req.body || {};
    if (!key || !uploadId || !Array.isArray(parts)) {
      return res.status(400).json({ error: "key, uploadId, parts required" });
    }
    const out = await s3.send(new CompleteMultipartUploadCommand({
      Bucket: BUCKET,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    }));
    res.json({ ok: true, key, location: out.Location || null });
  } catch (e) {
    console.error("[COMPLETE-MULTIPART ERROR]", e);
    res.status(500).json({ error: "Failed to complete upload", detail: e.message });
  }
});

router.post("/abort-multipart", async (req, res) => {
  try {
    setCORS(req, res);
    const { key, uploadId } = req.body || {};
    if (!key || !uploadId) {
      return res.status(400).json({ error: "key and uploadId required" });
    }
    await s3.send(new AbortMultipartUploadCommand({ Bucket: BUCKET, Key: key, UploadId: uploadId }));
    res.json({ ok: true });
  } catch (e) {
    console.error("[ABORT-MULTIPART ERROR]", e);
    res.status(500).json({ error: "Failed to abort upload", detail: e.message });
  }
});

/* ====================== Simple presign & direct ====================== */
router.post("/presignPut", async (req, res) => {
  try {
    setCORS(req, res);
    const { filename, contentType, folder } = req.body;
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
      ...(SSE ? { ServerSideEncryption: SSE } : {}),
    });

    const url = await getSignedUrl(s3, cmd, { expiresIn: 3600 });
    res.json({ url, key });
  } catch (e) {
    console.error("[presignPut ERROR]", e);
    res.status(500).json({ error: "Failed to presign", detail: e.message, name: e.name, code: e.$metadata?.httpStatusCode });
  }
});

router.post("/upload-direct", upload.single("file"), async (req, res) => {
  try {
    setCORS(req, res);
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
      ...(SSE ? { ServerSideEncryption: SSE } : {}),
    });

    await s3.send(cmd);
    res.json({ key });
  } catch (e) {
    console.error("[upload-direct ERROR]", e);
    res.status(500).json({ error: "Upload failed", detail: e.message, name: e.name, code: e.$metadata?.httpStatusCode });
  }
});

module.exports = router;
