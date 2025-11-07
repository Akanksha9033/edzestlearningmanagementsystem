// backend/routes/lessons.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Lesson = require("../models/Lesson");
const { authAccess, requireRoles } = require('../middleware/auth');

const { Types } = mongoose;
const isId = (v) => Types.ObjectId.isValid(String(v));
const ALLOWED_TYPES = new Set(["video", "pdf", "doc", "ppt", "audio", "link", "file"]);

// Try to load Course model from either path
let Course = null;
try { Course = require("../models/Course"); } catch {}
try { if (!Course) Course = require("../LMS_Models/Course"); } catch {}

function normalizeType(t) {
  const v = String(t || "video").toLowerCase();
  return ALLOWED_TYPES.has(v) ? v : "video";
}
function validateCreatePayload({ title, type, videoKey, fileUrl }) {
  if (!title || !String(title).trim()) return "title is required";
  const t = normalizeType(type);
  if (t === "video" && !videoKey) return "videoKey is required for video lessons";
  if (t !== "video" && !fileUrl) return "fileUrl is required for non-video lessons";
  return null;
}

/* ============================================================
   CREATE  : POST /api/courses/:courseId/lessons
   Body: { sectionId, title, type, videoKey?, fileUrl?, duration? }
   Auth: Admin/Teacher
   ALSO: Push minimal stub into Course.sections[].lessons so UI sees it
============================================================ */
router.post(
  "/:courseId/lessons",
  authAccess,
  requireRoles(["Admin", "Teacher"]),
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const { sectionId, title } = req.body;
      let { type, videoKey = "", fileUrl = "", duration = 0, isFree, status } = req.body;

      if (!isId(courseId)) return res.status(400).json({ message: "Invalid courseId" });
      if (!isId(sectionId)) return res.status(400).json({ message: "Invalid sectionId" });

      type = normalizeType(type);
      const err = validateCreatePayload({ title, type, videoKey, fileUrl });
      if (err) return res.status(400).json({ message: err });

      const doc = await Lesson.create({
        courseId,
        sectionId,
        title: String(title).trim(),
        type,
        videoKey: type === "video" ? videoKey : undefined,
        fileUrl: type !== "video" ? fileUrl : undefined,
        duration: Number(duration) || 0,
        isFree: !!isFree,
        status: status || "published",
      });

      // ⬇️ keep Course embedded lessons in sync (if Course model exists)
      let embeddedPushed = false;
      if (Course) {
        const r = await Course.updateOne(
          { _id: courseId, "sections._id": sectionId },
          {
            $push: {
              "sections.$.lessons": {
                _id: doc._id,
                title: doc.title,
                type: doc.type,
                // keep a hint fields if your UI needs them in list:
                duration: doc.duration || 0,
                videoKey: doc.videoKey || null,
              },
            },
          }
        );
        embeddedPushed = r.modifiedCount > 0;
      }

      return res.status(201).json({ ok: true, lesson: doc, embeddedPushed });
    } catch (error) {
      console.error("Create lesson error:", error);
      return res.status(500).json({ message: "Failed to create lesson" });
    }
  }
);

/* ============================================================
   UPDATE  : PUT /api/courses/lesson/:id
   Body: { title?, type?, videoKey?, fileUrl?, duration?, sectionId?, courseId?, isFree?, status? }
   Auth: Admin/Teacher
   ALSO: Sync embedded Course.sections[].lessons
============================================================ */
router.put(
  "/lesson/:id",
  authAccess,
  requireRoles(["Admin", "Teacher"]),
  async (req, res) => {
    try {
      const id = req.params.id;
      if (!isId(id)) return res.status(400).json({ message: "Invalid lesson id" });

      const body = req.body || {};
      const forbidden = new Set(["_id", "__v", "createdAt", "updatedAt"]);
      const allowed = new Set([
        "title",
        "type",
        "fileUrl",
        "videoUrl", // legacy
        "videoKey",
        "duration",
        "mockTestId",
        "sectionId",
        "courseId",
        "isFree",
        "status",
      ]);

      const $set = {};
      const $unset = {};

      for (const [k, v] of Object.entries(body)) {
        if (forbidden.has(k)) continue;
        if (!allowed.has(k)) continue;
        if (v === "" || v === null) $unset[k] = 1;
        else $set[k] = v;
      }

      const current = await Lesson.findById(id);
      if (!current) return res.status(404).json({ message: "Lesson not found" });

      // normalize type if changing
      if ($set.type) $set.type = normalizeType($set.type);

      const nextType = $set.type || current.type;
      const nextVideoKey = $set.videoKey ?? current.videoKey;
      const nextFileUrl = $set.fileUrl ?? current.fileUrl;

      // rules per type
      if (nextType === "video" && !nextVideoKey) {
        return res.status(400).json({ message: "videoKey is required when type is video" });
      }
      if (nextType !== "video" && !nextFileUrl) {
        return res.status(400).json({ message: "fileUrl is required when type is not video" });
      }

      if (Object.keys($set).length === 0 && Object.keys($unset).length === 0) {
        return res.status(400).json({ message: "Nothing to update" });
      }

      const update = {};
      if (Object.keys($set).length) update.$set = $set;
      if (Object.keys($unset).length) update.$unset = $unset;

      const updated = await Lesson.findByIdAndUpdate(id, update, {
        new: true,
        runValidators: true,
      });

      // ⬇️ Sync embedded lesson stub in Course
      if (Course) {
        const course = await Course.findOne({ "sections.lessons._id": id });
        if (course) {
          // detect if section changed
          const targetSectionId = ($set.sectionId && isId($set.sectionId))
            ? String($set.sectionId)
            : String(updated.sectionId);

          // remove from all sections, then push into the right one
          let found = null;
          for (const sec of course.sections) {
            const l = sec.lessons.id(id);
            if (l) {
              // if section remains same, just update fields
              if (String(sec._id) === targetSectionId) {
                if ($set.title !== undefined) l.title = updated.title;
                if ($set.type !== undefined) l.type = updated.type;
                if ($set.duration !== undefined) l.duration = updated.duration || 0;
                // keep hint of videoKey for list UIs
                if ($set.videoKey !== undefined) l.videoKey = updated.videoKey || null;
                found = l;
              } else {
                // moved to a different section: remove from here
                l.remove();
              }
            }
          }
          // if moved, push into target section
          if (!found && targetSectionId) {
            const target = course.sections.id(targetSectionId);
            if (target) {
              target.lessons.push({
                _id: updated._id,
                title: updated.title,
                type: updated.type,
                duration: updated.duration || 0,
                videoKey: updated.videoKey || null,
              });
            }
          }
          await course.save();
        }
      }

      return res.json({ ok: true, lesson: updated });
    } catch (error) {
      console.error("Update lesson error:", error);
      return res.status(500).json({ message: error.message || "Failed to update lesson" });
    }
  }
);

/* ============================================================
   GET ONE : GET /api/courses/lesson/:id
============================================================ */
router.get("/lesson/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!isId(id)) return res.status(400).json({ message: "Invalid lesson id" });

    const lesson = await Lesson.findById(id);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    return res.json({ ok: true, lesson });
  } catch (error) {
    console.error("Get lesson error:", error);
    return res.status(500).json({ message: "Failed to fetch lesson" });
  }
});

/* ============================================================
   LIST : GET /api/courses/:courseId/lessons?sectionId=...
============================================================ */
router.get("/:courseId/lessons", async (req, res) => {
  try {
    const { courseId } = req.params;
    const { sectionId } = req.query;

    if (!isId(courseId)) return res.status(400).json({ message: "Invalid courseId" });
    if (sectionId && !isId(sectionId)) {
      return res.status(400).json({ message: "Invalid sectionId" });
    }

    const q = { courseId };
    if (sectionId) q.sectionId = sectionId;

    const lessons = await Lesson.find(q).sort({ createdAt: 1 }).lean();
    return res.json({ ok: true, lessons });
  } catch (error) {
    console.error("List lessons error:", error);
    return res.status(500).json({ message: "Failed to list lessons" });
  }
});

/* ============================================================
   DELETE : DELETE /api/courses/lesson/:id
   ALSO: remove from embedded Course.sections[].lessons
============================================================ */
router.delete(
  "/lesson/:id",
  authAccess,
  requireRoles(["Admin", "Teacher"]),
  async (req, res) => {
    try {
      const id = req.params.id;
      if (!isId(id)) return res.status(400).json({ message: "Invalid lesson id" });

      const out = await Lesson.findByIdAndDelete(id);
      if (!out) return res.status(404).json({ message: "Lesson not found" });

      if (Course) {
        const course = await Course.findOne({ "sections.lessons._id": id });
        if (course) {
          for (const sec of course.sections) {
            const sub = sec.lessons.id(id);
            if (sub) sub.remove();
          }
          await course.save();
        }
      }

      return res.json({ ok: true });
    } catch (error) {
      console.error("Delete lesson error:", error);
      return res.status(500).json({ message: "Failed to delete lesson" });
    }
  }
);

module.exports = router;
