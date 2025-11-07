// routes/quickLessonPatch.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// Models try-catch (repo me jo path ho)
let Lesson = null;
try { Lesson = require("../models/Lesson"); } catch {}
let Course = null;
try { Course = require("../models/Course"); } catch {}
try { if (!Course) Course = require("../LMS_Models/Course"); } catch {}

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

async function updateLessonById(req, res) {
  try {
    const { lessonId } = req.params;
    if (!mongoose.isValidObjectId(lessonId)) {
      return res.status(400).json({ message: "Invalid lessonId" });
    }

    const clearCloudinary = !!req.body.clearCloudinary;

    // 1) Preferred: flat Lesson collection
    if (Lesson) {
      const $set = {};
      if (req.body.videoKey !== undefined) $set.videoKey = req.body.videoKey;
      if (req.body.type !== undefined) $set.type = req.body.type;
      const d = toNum(req.body.duration);
      if (d !== undefined) $set.duration = d;

      const update = {};
      if (Object.keys($set).length) update.$set = $set;
      if (clearCloudinary) update.$unset = { videoUrl: 1, fileUrl: 1 }; // ⬅️ clear Cloudinary URLs

      const updated = await Lesson.findByIdAndUpdate(lessonId, update, {
        new: true,
        runValidators: false, // ⬅️ fileUrl required validation ko bypass
      });

      if (updated) {
        return res.json({
          message: "Lesson updated",
          scope: "lesson-collection",
          lesson: updated,
        });
      }
    }

    // 2) Fallback: embedded lesson in Course.sections.lessons
    if (Course) {
      const course = await Course.findOne({ "sections.lessons._id": lessonId });
      if (course) {
        for (const sec of course.sections) {
          const l = sec.lessons.id(lessonId);
          if (l) {
            if (req.body.videoKey !== undefined) l.videoKey = req.body.videoKey;
            if (req.body.type !== undefined) l.type = req.body.type;
            const d = toNum(req.body.duration);
            if (d !== undefined) l.duration = d;

            if (clearCloudinary) {
              l.videoUrl = undefined;
              l.fileUrl = undefined;
            }

            await course.save();
            return res.json({
              message: "Lesson updated",
              scope: "embedded",
              lesson: l,
            });
          }
        }
      }
    }

    return res.status(404).json({ message: "Lesson not found" });
  } catch (err) {
    console.error("PATCH /api/quick/lessons/:lessonId error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

router.patch("/lessons/:lessonId", updateLessonById);
router.put("/lessons/:lessonId", updateLessonById); // alias

// DELETE a lesson by id (works for both Lesson collection & embedded lessons)
router.delete("/lessons/:lessonId", async (req, res) => {
  try {
    const { lessonId } = req.params;
    if (!mongoose.isValidObjectId(lessonId)) {
      return res.status(400).json({ message: "Invalid lessonId" });
    }

    let removedFromLesson = false;
    let removedFromEmbedded = false;

    if (Lesson) {
      const r = await Lesson.findByIdAndDelete(lessonId);
      if (r) removedFromLesson = true;
    }

    if (Course) {
      const course = await Course.findOne({ "sections.lessons._id": lessonId });
      if (course) {
        for (const sec of course.sections) {
          const sub = sec.lessons.id(lessonId);
          if (sub) {
            sub.remove(); // remove from array
            removedFromEmbedded = true;
          }
        }
        await course.save();
      }
    }

    if (!removedFromLesson && !removedFromEmbedded) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    res.json({
      message: "Lesson deleted",
      removedFrom: {
        lessonCollection: removedFromLesson,
        embedded: removedFromEmbedded,
      },
    });
  } catch (err) {
    console.error("DELETE /api/quick/lessons/:lessonId error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// quick health check
router.get("/health", (_req, res) => res.json({ ok: true }));

module.exports = router;
