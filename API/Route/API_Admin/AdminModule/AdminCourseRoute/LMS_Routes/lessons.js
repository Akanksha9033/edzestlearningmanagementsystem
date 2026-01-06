// Route/API_Admin/AdminModule/AdminCourseRoute/LMS_Routes/lessons.js
const express = require("express");
const router = express.Router({ mergeParams: true }); // ✅ IMPORTANT
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const Lesson = require("../../models/Lesson");

const { authAccess, requireRoles } =
  require("../../../../../middleware/auth");

/* -------- optional debug to verify routing (can remove) -------- */
// router.use((req, _res, next) => { console.log("[lessons.js]", req.method, req.originalUrl); next(); });

/* -------------------- types -------------------- */
const ALLOWED_TYPES = new Set([
  "video","pdf","doc","ppt","audio","slides","assignment","scorm/tincan",
  "article","live","external link","section quiz","quiz",
]);

const normalizeType = (t) => {
  const v = String(t || "").toLowerCase();
  if (v.includes("quiz")) return "quiz";   // ⭐ QUIZ FORCE
  return ALLOWED_TYPES.has(v) ? v : "video";
};


/* -------------------- S3 helpers -------------------- */
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const BUCKET = process.env.S3_BUCKET;

const isDataUrl = (s) => typeof s === "string" && /^data:/i.test(s);
const isHttpUrl = (s) => typeof s === "string" && /^https?:\/\//i.test(s);

const guessName = (ctype, fallback) => {
  const f = fallback || "file.bin";
  if (String(ctype).includes("html")) return "article.html";
  if (String(ctype).includes("pdf"))  return "file.pdf";
  if (String(ctype).includes("mp4"))  return "video.mp4";
  if (String(ctype).includes("mpeg")) return "audio.mp3";
  return f;
};

const folderPrefix = (folder) => (folder ? `${folder.replace(/\/+$/,"")}/` : "lessons/");

async function uploadBufferToS3(buffer, contentType, filename, folder) {
  const key = `${folderPrefix(folder)}${uuidv4()}-${filename || "lesson-file"}`;
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType || "application/octet-stream",
  }));
  return key;
}
async function uploadBase64ToS3(base64, contentType, filename, folder) {
  const b64 = String(base64 || "").replace(/^data:[^;]+;base64,/, "");
  const buf = Buffer.from(b64, "base64");
  return uploadBufferToS3(buf, contentType, filename, folder);
}
async function uploadFromUrlToS3(url, folder, fallbackName) {
  const resp = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 30000,
    maxContentLength: 50 * 1024 * 1024,
    headers: { "User-Agent": "Edzest-LMS/1.0 (+S3 importer)" },
  });
  const contentType = resp.headers["content-type"] || "application/octet-stream";
  const name = guessName(contentType, fallbackName);
  return uploadBufferToS3(Buffer.from(resp.data), contentType, name, folder);
}

/* ================== CREATE ================== */
router.post(
  "/:courseId/lessons",
  authAccess,
  requireRoles(["Admin", "Teacher"]),
  async (req, res) => {
    const { courseId } = req.params;
    const {
      _id: _idFromClient,
      sectionId, title, type,
      videoKey: videoKeyFromClient,
      fileKey:  fileKeyFromClient,
      videoBase64, videoContentType, videoFilename,
      fileBase64,  fileContentType,  fileFilename,
      duration, status, fileUrl, videoUrl,
    } = req.body;

    try {
      if (!courseId || !sectionId) return res.status(400).json({ message: "courseId and sectionId required" });
      if (!title) return res.status(400).json({ message: "Title is required" });

      const normType = normalizeType(type);
      // ⭐ QUIZ CREATE HANDLER — no video/file needed
if (normType === "quiz") {
  const doc = await Lesson.create({
    _id: _idFromClient,
    courseId,
    sectionId,
    title: String(title).trim(),
    type: "quiz",
    questions: req.body.questions || [],
    explanation: req.body.explanation || "",
    duration: Number(duration) || 0,
    status: status || "draft",
  });

  return res.status(201).json({ ok: true, lesson: doc });
}

      const folder = `courses/${courseId}/sections/${sectionId}`;

      let videoKey = "";
      let fileKey  = "";
      let fileUrlOut  = "";
      let videoUrlOut = "";

      if (normType === "video") {
        if (videoKeyFromClient) videoKey = videoKeyFromClient;
        else if (videoBase64)   videoKey = await uploadBase64ToS3(videoBase64, videoContentType || "video/mp4", videoFilename || "video.mp4", folder);
        else if (isDataUrl(videoUrl)) videoKey = await uploadBase64ToS3(videoUrl, videoContentType || "video/mp4", videoFilename || "video.mp4", folder);
        else if (isHttpUrl(videoUrl)) videoKey = await uploadFromUrlToS3(videoUrl, folder, "video.mp4");
        else if (isDataUrl(fileUrl))  videoKey = await uploadBase64ToS3(fileUrl, videoContentType || "video/mp4", videoFilename || "video.mp4", folder);
        else if (isHttpUrl(fileUrl))  videoKey = await uploadFromUrlToS3(fileUrl, folder, "video.mp4");
        else return res.status(400).json({ message: "videoKey/videoBase64/URL required for video lessons" });
      } else if (normType === "external link") {
        if (fileKeyFromClient) { fileKey = fileKeyFromClient; fileUrlOut = String(fileUrl || ""); }
        else if (fileBase64)   fileKey = await uploadBase64ToS3(fileBase64, fileContentType, fileFilename, folder);
        else if (isDataUrl(fileUrl)) {
          const ct = (fileUrl.match(/^data:([^;]+);base64,/) || [])[1] || fileContentType || "text/html";
          const name = guessName(ct, "external.html");
          fileKey = await uploadBase64ToS3(fileUrl, ct, name, folder);
        } else if (isHttpUrl(fileUrl)) { fileKey = await uploadFromUrlToS3(fileUrl, folder, "external.bin"); fileUrlOut = String(fileUrl || ""); }
        else return res.status(400).json({ message: "Valid URL/file required for external link lessons" });
      } else {
        if (fileKeyFromClient) fileKey = fileKeyFromClient;
        else if (fileBase64)   fileKey = await uploadBase64ToS3(fileBase64, fileContentType, fileFilename, folder);
        else if (isDataUrl(fileUrl)) {
          const ct = (fileUrl.match(/^data:([^;]+);base64,/) || [])[1] || fileContentType || (normType === "article" ? "text/html" : "application/octet-stream");
          const name = guessName(ct, normType === "article" ? "article.html" : "file.bin");
          fileKey = await uploadBase64ToS3(fileUrl, ct, name, folder);
        } else if (isHttpUrl(fileUrl)) {
          fileKey = await uploadFromUrlToS3(fileUrl, folder, normType === "article" ? "article.html" : "file.bin");
          fileUrlOut = String(fileUrl || "");
        } else if (normType === "live") {
          return res.status(400).json({ message: "live lesson requires fileKey from Zoom link uploader" });
        } else {
          return res.status(400).json({ message: `${normType} lesson requires fileKey/fileBase64/URL` });
        }
      }

      const doc = await Lesson.create({
        _id: _idFromClient,
        courseId,
        sectionId,
        title: String(title).trim(),
        type: normType,
        videoKey,
        fileKey,
        fileUrl: fileUrlOut,
        videoUrl: videoUrlOut,
        duration: Number(duration) || 0,
        status: status || "draft",
      });
      // =======================
// ✅ FINAL HLS FIX (DO NOT CHANGE ANY OTHER LOGIC)
// =======================

// =======================
// ✅ FINAL HLS FIX (CORRECT PATH)
// =======================

// 🔥 ONLY CHANGE THIS BLOCK
// =======================
// ✅ FINAL HLS FIX (ONLY THIS BLOCK)
// =======================

if (normType === "video" && videoKey) {
  const baseName = videoKey
    .replace(/^raw\//, "")
    .replace(/\.mp4$/i, "");

  const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;

  const hlsUrl =
    `https://${CLOUDFRONT_DOMAIN}/${baseName}/${baseName}_hls.m3u8`;

  await Lesson.findByIdAndUpdate(
    doc._id,
    {
      videoUrl: hlsUrl,   // ✅ CloudFront URL
      videoKey: "",
    },
    { new: true }
  );

  console.log("✅ CloudFront HLS URL saved:", hlsUrl);
}







      // ⭐ SAVE UPLOADED VIDEO INFO TO NEW DYNAMODB TABLE
try {
  const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

  const ddb = new DynamoDBClient({ region: process.env.AWS_REGION });

  await ddb.send(
    new PutItemCommand({
      TableName: "EdzestVideoTable",
      Item: {
        lessonId:  { S: doc._id.toString() },
        courseId:  { S: courseId },
        sectionId: { S: sectionId },
       videoKey: { S: normType === "video" ? hlsUrl : (videoKey || "") },


        type:      { S: normType },
        createdAt: { S: new Date().toISOString() }
      }
    })
  );

  console.log("🔥 UI Upload Saved to EdzestVideoTable");

} catch (e) {
  console.error("❌ Dynamo Insert Failed:", e);
}


      res.status(201).json({ ok: true, lesson: doc });
    } catch (err) {
      console.error("❌ Create lesson error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* ================== UPDATE ================== */
router.put(
  "/lesson/:id",
  authAccess,
  requireRoles(["Admin", "Teacher"]),
  async (req, res) => {
    try {
      const id = req.params.id;
      const body = req.body;

      const existing = await Lesson.findById(id);
      const folder = existing
        ? `courses/${existing.courseId}/sections/${existing.sectionId}`
        : "lessons";

      const $set = {};
      [
  "title",
  "type",
  "duration",
  "status",
  "videoKey",
  "fileKey",
  "fileUrl",
  "videoUrl",
  "questions",       // ⭐ added
  "explanation"      // ⭐ added
].forEach((f) => {
  if (body[f] !== undefined) $set[f] = body[f];
});

      if ($set.type) $set.type = normalizeType($set.type);

      if (body.videoBase64) $set.videoKey = await uploadBase64ToS3(body.videoBase64, body.videoContentType || "video/mp4", body.videoFilename || "video.mp4", folder);
      if (body.fileBase64)  $set.fileKey  = await uploadBase64ToS3(body.fileBase64,  body.fileContentType,  body.fileFilename,  folder);

      if (!$set.videoKey && isDataUrl(body.videoUrl)) {
        $set.videoKey = await uploadBase64ToS3(body.videoUrl, body.videoContentType || "video/mp4", body.videoFilename || "video.mp4", folder);
        $set.videoUrl = "";
      }
      if (!$set.fileKey && isDataUrl(body.fileUrl)) {
        const ct = (body.fileUrl.match(/^data:([^;]+);base64,/) || [])[1] || "application/octet-stream";
        const name = (($set.type || existing?.type) === "article") ? "article.html" : "file.bin";
        $set.fileKey = await uploadBase64ToS3(body.fileUrl, ct, name, folder);
        $set.fileUrl = "";
      }

      if (!$set.videoKey && isHttpUrl(body.videoUrl)) $set.videoKey = await uploadFromUrlToS3(body.videoUrl, folder, "video.mp4");
      if (!$set.fileKey  && isHttpUrl(body.fileUrl))  $set.fileKey  = await uploadFromUrlToS3(body.fileUrl,  folder, (($set.type || existing?.type) === "article") ? "article.html" : "file.bin");

      const updated = await Lesson.findByIdAndUpdate(id, { $set });
      if (!updated) return res.status(404).json({ message: "Lesson not found" });

      res.json({ ok: true, lesson: updated });
    } catch (err) {
      console.error("❌ Update lesson error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* ================== READ/LIST ================== */
router.get("/lesson/:id", authAccess, async (req, res) => {
  try {
    const l = await Lesson.findById(req.params.id);
    if (!l) return res.status(404).json({ message: "Lesson not found" });
    res.json({ lesson: l });
  } catch (err) {
    console.error("❌ Read lesson error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:courseId/lessons", authAccess, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { sectionId } = req.query;
    if (!courseId) return res.status(400).json({ message: "Invalid courseId" });
    const lessons = await Lesson.find({ courseId, sectionId });
    res.json({ lessons });
  } catch (err) {
    console.error("❌ List lessons error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================== DELETE (FINAL) ================== */

// 1) EXACT path your UI calls (singular):
//    DELETE /api/courses/:courseId/lesson/:lessonId
router.delete(
  "/:courseId/lesson/:lessonId",
  authAccess,
  requireRoles(["Admin", "Teacher"]),
  async (req, res) => {
    try {
      const { lessonId } = req.params;
      const out = await Lesson.findByIdAndDelete(lessonId);
      if (!out) return res.status(404).json({ message: "Lesson not found" });
      return res.sendStatus(204);
    } catch (err) {
      console.error("❌ Delete lesson (singular) error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// 2) Alias (plural) so both forms work:
//    DELETE /api/courses/:courseId/lessons/:lessonId
router.delete(
  "/:courseId/lessons/:lessonId",
  authAccess,
  requireRoles(["Admin", "Teacher"]),
  async (req, res) => {
    try {
      const { lessonId } = req.params;
      const out = await Lesson.findByIdAndDelete(lessonId);
      if (!out) return res.status(404).json({ message: "Lesson not found" });
      return res.sendStatus(204);
    } catch (err) {
      console.error("❌ Delete lesson (plural) error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// 3) Keep a simple scoped route if ever mounted differently:
//    DELETE /api/courses/lessons/:id  (not used by your UI but harmless)
router.delete(
  "/lesson/:id",
  authAccess,
  requireRoles(["Admin", "Teacher"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const out = await Lesson.findByIdAndDelete(id);
      if (!out) return res.status(404).json({ message: "Lesson not found" });
      return res.sendStatus(204);
    } catch (err) {
      console.error("❌ Delete lesson (scoped) error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
