const express = require("express");
const multer = require("multer");
const fs = require("fs");
const os = require("os");

// 👇 यह path आपके ट्री के हिसाब से सही है:
// API/Route/.../routes/driveUploads.js  ->  API/utils/upload-to-drive.js
const uploadToDrive = require("../../../../../../utils/upload-to-drive");

const router = express.Router();

// Lambda पर /tmp, लोकल पर OS tmp dir (cross-env safe)
const TMP_DIR = process.env.UPLOAD_TMP_DIR || os.tmpdir();

// 1 GB तक allow (इच्छानुसार बदल सकते हैं)
const upload = multer({
  dest: TMP_DIR,
  limits: { fileSize: 1024 * 1024 * 1024 },
});

// Optional health check
router.get("/_health", (req, res) =>
  res.json({ ok: true, where: "media uploads" })
);

router.post("/upload-file", upload.single("file"), async (req, res) => {
  let tempPath;
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file provided (field 'file')." });
    }

    // Google Drive folder ID (env से लें तो बेहतर)
    const folderId =
      process.env.GDRIVE_COURSE_FOLDER_ID || "1aaZwyZMRTWg83CBQK8S_jD8OOgktUlbn";

    tempPath = file.path;

    // Drive पर upload
    const uploaded = await uploadToDrive(
      tempPath,
      file.originalname,
      file.mimetype,
      folderId
    );

    // temp फाइल साफ़ करें
    try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (_) {}

    return res.json({
      fileId: uploaded.id,
      name: uploaded.name,
      mimeType: uploaded.mimeType,
      fileUrl: uploaded.webViewLink,
      downloadUrl: uploaded.webContentLink,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ message: "Upload failed" });
  } finally {
    // safety cleanup
    if (tempPath) {
      try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (_) {}
    }
  }
});

module.exports = router;
