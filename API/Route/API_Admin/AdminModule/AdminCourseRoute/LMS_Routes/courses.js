// // API/Route/API_Admin/AdminModule/AdminCourseRoute/LMS_Routes/courses.js
// const path = require("path");
// const express = require("express");
// const router = express.Router();
// const { v4: uuidv4 } = require("uuid");
// const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

// /* ---------------- Resolve models & middleware (no logic change) ---------------- */
// const COURSES_MODEL_PATH = path.join(__dirname, "..", "..", "models", "Courses.js");
// const LESSON_MODEL_PATH  = path.join(__dirname, "..", "..", "models", "Lesson.js");
// const AUTH_MW_PRIMARY    = path.join(__dirname, "..", "..", "middleware", "auth.js");
// const AUTH_MW_FALLBACK   = path.join(__dirname, "..", "..", "..", "..", "..", "middleware", "auth.js");

// // Courses (required)
// const Courses = require(COURSES_MODEL_PATH);

// // Lesson (optional — not present in some repos)
// let Lesson;
// try {
//   Lesson = require(LESSON_MODEL_PATH);
// } catch {
//   // fallback stub so routes don’t crash
//   Lesson = { find: async () => [] };
// }

// // Auth middleware (try AdminModule/middleware/auth.js, else API/middleware/auth.js)
// let authMod;
// try {
//   authMod = require(AUTH_MW_PRIMARY);
// } catch {
//   authMod = require(AUTH_MW_FALLBACK);
// }
// const { authAccess, requireRoles } = authMod;

// /* ---------------- AWS S3 ---------------- */
// const s3 = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });
// const BUCKET = process.env.S3_BUCKET;

// /* ---------------- Helpers (unchanged logic) ---------------- */
// const isHex24 = (s) => /^[0-9a-fA-F]{24}$/.test(String(s || ""));

// async function loadCourseByIdOrKey(val) {
//   if (!val) return null;

//   // 1) try by id
//   try {
//     const byId = await Courses.findById(String(val));
//     if (byId) return byId;
//   } catch (_) {}

//   // 2) try slug
//   const slug = String(val).trim().toLowerCase();
//   try {
//     const bySlug = await Courses.findOne({ slug });
//     if (bySlug) return bySlug;
//   } catch (_) {}

//   return null;
// }

// async function uploadToS3(base64, contentType, filename) {
//   const base64Data = Buffer.from(
//     base64.replace(/^data:[^;]+;base64,/, ""),
//     "base64"
//   );
//   const key = `courses/${uuidv4()}-${filename || "course-image"}`;
//   await s3.send(
//     new PutObjectCommand({
//       Bucket: BUCKET,
//       Key: key,
//       Body: base64Data,
//       ContentType: contentType || "image/png",
//     })
//   );
//   return `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
// }

// // Smart fetch lessons (multiple fallbacks; no logic change)
// async function fetchLessonsForCourse(courseDoc) {
//   if (!courseDoc) return [];
//   const courseId = String(courseDoc._id || "");
//   const slug = String(courseDoc.slug || "").toLowerCase();

//   // 1: courseId string
//   let lessons = await Lesson.find({ courseId });

//   // 2: raw _id
//   if (!lessons?.length) lessons = await Lesson.find({ courseId: courseDoc._id });

//   // 3: slug in courseSlug / courseKey
//   if (!lessons?.length && slug) {
//     const bySlug = await Lesson.find({ courseSlug: slug });
//     lessons = bySlug?.length ? bySlug : lessons;

//     if (!lessons?.length) {
//       const byKey = await Lesson.find({ courseKey: slug });
//       lessons = byKey?.length ? byKey : lessons;
//     }
//   }

//   // 4: last-resort scan/filter
//   if (!lessons?.length) {
//     const all = await Lesson.find({});
//     lessons = (all || []).filter(
//       (l) =>
//         String(l.courseId || "") === courseId ||
//         String(l.courseId || "") === String(courseDoc._id) ||
//         String(l.courseSlug || "").toLowerCase() === slug ||
//         String(l.courseKey || "").toLowerCase() === slug
//     );
//   }
//   return lessons || [];
// }

// /** attach lessons into sections (no logic change) */
// async function hydrateLessonsIntoSections(_courseId, courseDoc) {
//   if (!courseDoc) return courseDoc;

//   const course = courseDoc.toObject ? courseDoc.toObject() : courseDoc;
//   course.sections = Array.isArray(course.sections) ? course.sections : [];

//   const lessons = await fetchLessonsForCourse(course);

//   const bySection = (lessons || []).reduce((acc, l) => {
//     const sid = String(l.sectionId || "");
//     if (!sid) return acc;
//     (acc[sid] ||= []).push({
//       _id: l._id,
//       title: l.title,
//       type: l.type,
//       duration: l.duration || 0,
//       videoKey: l.videoKey || null,
//       fileKey: l.fileKey || null,
//       fileUrl: l.fileUrl || "",
//       videoUrl: l.videoUrl || "",
//       status: l.status || "draft",
//       createdAt: l.createdAt,
//       updatedAt: l.updatedAt,
//       sectionId: sid,
//     });
//     return acc;
//   }, {});

//   for (const s of course.sections) {
//     s.lessons = bySection[String(s._id)] || [];
//   }

//   const sectionIds = new Set(course.sections.map((s) => String(s._id)));
//   const orphans = (lessons || []).filter(
//     (l) => l.sectionId && !sectionIds.has(String(l.sectionId))
//   );
//   if (orphans.length) {
//     const unassignedId = `unassigned-${String(course._id).slice(0, 8)}`;
//     let unassigned = course.sections.find((s) => s._id === unassignedId);
//     if (!unassigned) {
//       unassigned = { _id: unassignedId, title: "Unassigned", lessons: [] };
//       course.sections.push(unassigned);
//     }
//     unassigned.lessons.push(
//       ...orphans.map((l) => ({
//         _id: l._id,
//         title: l.title,
//         type: l.type,
//         duration: l.duration || 0,
//         videoKey: l.videoKey || null,
//         fileKey: l.fileKey || null,
//         fileUrl: l.fileUrl || "",
//         videoUrl: l.videoUrl || "",
//         status: l.status || "draft",
//         createdAt: l.createdAt,
//         updatedAt: l.updatedAt,
//         sectionId: String(l.sectionId || ""),
//       }))
//     );
//   }

//   return course;
// }

// /* ---------------- Health/debug (same) ---------------- */
// router.get("/_health", (req, res) => {
//   res.json({ ok: true, where: "courses router" });
// });

// router.get("/noauth/:val", async (req, res) => {
//   try {
//     const cdoc = await loadCourseByIdOrKey(req.params.val);
//     if (!cdoc) return res.status(404).json({ message: "Course not found" });
//     const course = await hydrateLessonsIntoSections(String(cdoc._id), cdoc);
//     res.json({ course });
//   } catch (e) {
//     res.status(500).json({ message: "Server error", detail: e.message });
//   }
// });

// router.get("/debug/:val", async (req, res) => {
//   try {
//     const cdoc = await loadCourseByIdOrKey(req.params.val);
//     if (!cdoc) return res.status(404).json({ ok: false, reason: "course-not-found" });
//     res.json({
//       ok: true,
//       courseId: String(cdoc._id),
//       slug: cdoc.slug,
//       sectionCount: Array.isArray(cdoc.sections) ? cdoc.sections.length : 0,
//     });
//   } catch (e) {
//     res.status(500).json({ ok: false, error: e.message });
//   }
// });

// /* ---------------- ADMIN ROUTES (unchanged logic) ---------------- */
// router.post(
//   "/create-course",
//   authAccess,
//   requireRoles(["SuperAdmin", "Admin", "Teacher"]),
//   async (req, res) => {
//     try {
//       const {
//         title,
//         price,
//         isFree,
//         status,
//         instituteId,
//         imageBase64,
//         imageContentType,
//         imageFilename,
//       } = req.body;

//       if (!title) return res.status(400).json({ message: "Title is required" });
//       if (price && Number(price) < 0)
//         return res.status(400).json({ message: "Price cannot be negative" });

//       const slugify = (str) =>
//         String(str).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
//       const slug = slugify(title);

//       const existing = await Courses.findOne({ slug });
//       if (existing) {
//         return res
//           .status(400)
//           .json({ message: `Course "${title}" already exists.` });
//       }

//       let imageUrl = null;
//       if (imageBase64) {
//         imageUrl = await uploadToS3(imageBase64, imageContentType, imageFilename);
//       }

//       const coursePayload = {
//         title: title.trim(),
//         slug,
//         price: String(isFree) === "true" || isFree === true ? 0 : Number(price || 0),
//         isFree: String(isFree) === "true" || isFree === true,
//         status: status || "unpublished",
//         createdBy: req.user.id,
//         instituteId: instituteId || null,
//         image: imageUrl,
//         sections: [],
//       };

//       const course = new Courses(coursePayload);
//       await course.save();

//       res.status(201).json({ message: "Course created successfully", course });
//     } catch (err) {
//       console.error("❌ Course creation error:", err);
//       res.status(500).json({ message: "Server error" });
//     }
//   }
// );

// /* Full course (hydrate lessons) */
// router.get("/:courseId/full", authAccess, async (req, res) => {
//   try {
//     const { courseId } = req.params;

//     const courseDoc = await Courses.findById(courseId);
//     if (!courseDoc) return res.status(404).json({ message: "Course not found" });

//     const course = await hydrateLessonsIntoSections(courseId, courseDoc);
//     return res.json({ course });
//   } catch (err) {
//     console.error("❌ Full course fetch error:", err);
//     return res.status(500).json({ message: "Server error", detail: err.message });
//   }
// });

// /* Fetch by id or slug (hydrate lessons) */
// router.get("/:courseId", authAccess, async (req, res) => {
//   try {
//     const cdoc = await loadCourseByIdOrKey(req.params.courseId);
//     if (!cdoc) return res.status(404).json({ message: "Course not found" });

//     const course = await hydrateLessonsIntoSections(String(cdoc._id), cdoc);
//     res.json({ course });
//   } catch (err) {
//     console.error("❌ Course fetch error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// /* Explicit fallback (hydrate lessons) */
// router.get("/fetchCourse/by/:courseId", authAccess, async (req, res) => {
//   try {
//     const { courseId } = req.params;

//     const courseDoc = await Courses.findById(courseId);
//     if (!courseDoc) return res.status(404).json({ message: "Course not found" });

//     const course = await hydrateLessonsIntoSections(courseId, courseDoc);
//     res.json({ course });
//   } catch (err) {
//     console.error("❌ Fallback fetchCourse error:", err);
//     res.status(500).json({ message: "Server error", detail: err.message });
//   }
// });

// /* Add Section */
// router.post("/:courseId/add-section", authAccess, requireRoles(["Admin", "Teacher"]), async (req, res) => {
//   try {
//     const { title } = req.body;
//     if (!title || title.trim() === "")
//       return res.status(400).json({ message: "Section title is required" });

//     const course = await Courses.findById(req.params.courseId);
//     if (!course) return res.status(404).json({ message: "Course not found" });

//     const newSection = { _id: uuidv4(), title: title.trim(), lessons: [] };
//     course.sections.push(newSection);
//     await course.save();

//     res.status(200).json({ message: "Section added", section: newSection });
//   } catch (err) {
//     console.error("❌ Add section error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// /* Update Section Title */
// router.put("/:courseId/section/:sectionId", authAccess, requireRoles(["Admin", "Teacher"]), async (req, res) => {
//   try {
//     const { title } = req.body;
//     const course = await Courses.findById(req.params.courseId);
//     if (!course) return res.status(404).json({ message: "Course not found" });

//     const section = course.sections.find((s) => String(s._id) === String(req.params.sectionId));
//     if (!section) return res.status(404).json({ message: "Section not found" });

//     section.title = title.trim();
//     await course.save();

//     res.json({ message: "Section updated", section });
//   } catch (err) {
//     console.error("❌ Update section error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// /* Delete Section */
// router.delete("/:courseId/section/:sectionId", authAccess, requireRoles(["Admin", "Teacher"]), async (req, res) => {
//   try {
//     const course = await Courses.findById(req.params.courseId);
//     if (!course) return res.status(404).json({ message: "Course not found" });

//     course.sections = course.sections.filter(
//       (s) => String(s._id) !== req.params.sectionId
//     );
//     await course.save();

//     res.json({ message: "Section deleted successfully" });
//   } catch (err) {
//     console.error("❌ Delete section error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// /* Toggle Publish */
// router.patch("/:courseId/publish", authAccess, requireRoles(["Admin", "Teacher"]), async (req, res) => {
//   try {
//     const course = await Courses.findById(req.params.courseId);
//     if (!course) return res.status(404).json({ message: "Course not found" });

//     course.status = course.status === "published" ? "unpublished" : "published";
//     await course.save();

//     res.json({ message: "Publish status updated", course });
//   } catch (err) {
//     console.error("❌ Publish error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// /* List (admin sees all, student sees published) */
// router.get("/student-visible-courses", authAccess, async (req, res) => {
//   try {
//     const courses = await Courses.find({ status: "published" });
//     res.json({ courses });
//   } catch (err) {
//     console.error("❌ Fetch published error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// router.get("/", authAccess, async (req, res) => {
//   try {
//     const role  = String(req.user?.role || "").toLowerCase();
//     const query = role === "student" ? { status: "published" } : {};

//     const courseDocs = await Courses.find(query);

//     const courses = await Promise.all(
//       (courseDocs || []).map(async (doc) => {
//         const c = doc && doc.toObject ? doc.toObject() : doc || {};
//         c.sections = Array.isArray(c.sections) ? c.sections : [];
//         for (const s of c.sections) s.lessons = Array.isArray(s.lessons) ? s.lessons : [];
//         return hydrateLessonsIntoSections(String(c._id), c);
//       })
//     );

//     res.json({ courses });
//   } catch (err) {
//     console.error("❌ List courses error:", err?.message, err?.stack);
//     res.status(500).json({ message: "Server error", detail: err?.message });
//   }
// });

// /* ---------------- NEW: Delete entire Course (cascade lessons/sections) ---------------- */
// router.delete(
//   "/:courseId",
//   authAccess,
//   requireRoles(["SuperAdmin", "Admin", "Teacher"]),
//   async (req, res) => {
//     try {
//       const { courseId } = req.params;

//       // Load course by id or slug using existing helper
//       const courseDoc = await loadCourseByIdOrKey(courseId);
//       if (!courseDoc) {
//         return res.status(404).json({ success: false, message: "Course not found" });
//       }

//       const cid  = String(courseDoc._id);
//       const slug = String(courseDoc.slug || "").toLowerCase();

//       // 1) Try to delete lessons if a separate Lesson collection exists
//       try {
//         if (Lesson && typeof Lesson.deleteMany === "function") {
//           await Lesson.deleteMany({
//             $or: [
//               { courseId: cid },
//               { courseId: courseDoc._id },
//               { courseSlug: slug },
//               { courseKey: slug },
//             ],
//           });
//         } else if (Lesson && typeof Lesson.removeByCourseId === "function") {
//           await Lesson.removeByCourseId(cid);
//         }
//       } catch (e) {
//         console.warn("Lessons cascade delete warning:", e?.message);
//       }

//       // 2) If lessons are embedded, clear sections (safe no-op otherwise)
//       try {
//         if (Array.isArray(courseDoc.sections)) {
//           courseDoc.sections = [];
//           await courseDoc.save();
//         }
//       } catch (e) {
//         console.warn("Section cleanup warning:", e?.message);
//       }

//       // 3) Delete the course itself
//       await Courses.findByIdAndDelete(cid);

//       return res.json({ success: true, message: "Course and related data deleted" });
//     } catch (err) {
//       console.error("❌ Delete course error:", err);
//       return res.status(500).json({ success: false, message: "Server error", detail: err?.message });
//     }
//   }
// );

// module.exports = router;

// API/Route/API_Admin/AdminModule/AdminCourseRoute/LMS_Routes/courses.js
const path = require("path");
const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });


/* ---------------- Resolve models & middleware (no logic change) ---------------- */
const COURSES_MODEL_PATH = path.join(__dirname, "..", "..", "models", "Courses.js");
const LESSON_MODEL_PATH  = path.join(__dirname, "..", "..", "models", "Lesson.js");
const AUTH_MW_PRIMARY    = path.join(__dirname, "..", "..", "middleware", "auth.js");
const AUTH_MW_FALLBACK   = path.join(__dirname, "..", "..", "..", "..", "..", "middleware", "auth.js");

// Courses (required)
const Courses = require(COURSES_MODEL_PATH);

// Lesson (optional — not present in some repos)
let Lesson;
try {
  Lesson = require(LESSON_MODEL_PATH);
} catch {
  // fallback stub so routes don’t crash
  Lesson = { find: async () => [] };
}

// Auth middleware (try AdminModule/middleware/auth.js, else API/middleware/auth.js)
let authMod;
try {
  authMod = require(AUTH_MW_PRIMARY);
} catch {
  authMod = require(AUTH_MW_FALLBACK);
}
const { authAccess, requireRoles } = authMod;

/* ---------------- AWS S3 ---------------- */
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const BUCKET = process.env.S3_BUCKET;

/* ---------------- Helpers (unchanged logic) ---------------- */
const isHex24 = (s) => /^[0-9a-fA-F]{24}$/.test(String(s || ""));

async function loadCourseByIdOrKey(val) {
  if (!val) return null;

  // 1) try by id
  try {
    const byId = await Courses.findById(String(val));
    if (byId) return byId;
  } catch (_) {}

  // 2) try slug
  const slug = String(val).trim().toLowerCase();
  try {
    const bySlug = await Courses.findOne({ slug });
    if (bySlug) return bySlug;
  } catch (_) {}

  return null;
}

async function uploadToS3(base64, contentType, filename) {
  const base64Data = Buffer.from(
    base64.replace(/^data:[^;]+;base64,/, ""),
    "base64"
  );
  const key = `courses/${uuidv4()}-${filename || "course-image"}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: base64Data,
      ContentType: contentType || "image/png",
    })
  );
  return `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

// Smart fetch lessons (multiple fallbacks; no logic change)
async function fetchLessonsForCourse(courseDoc) {
  if (!courseDoc) return [];
  const courseId = String(courseDoc._id || "");
  const slug = String(courseDoc.slug || "").toLowerCase();

  // 1: courseId string
  let lessons = await Lesson.find({ courseId });

  // 2: raw _id
  if (!lessons?.length) lessons = await Lesson.find({ courseId: courseDoc._id });

  // 3: slug in courseSlug / courseKey
  if (!lessons?.length && slug) {
    const bySlug = await Lesson.find({ courseSlug: slug });
    lessons = bySlug?.length ? bySlug : lessons;

    if (!lessons?.length) {
      const byKey = await Lesson.find({ courseKey: slug });
      lessons = byKey?.length ? byKey : lessons;
    }
  }

  // 4: last-resort scan/filter
  if (!lessons?.length) {
    const all = await Lesson.find({});
    lessons = (all || []).filter(
      (l) =>
        String(l.courseId || "") === courseId ||
        String(l.courseId || "") === String(courseDoc._id) ||
        String(l.courseSlug || "").toLowerCase() === slug ||
        String(l.courseKey || "").toLowerCase() === slug
    );
  }
  return lessons || [];
}

/** attach lessons into sections (no logic change) */
async function hydrateLessonsIntoSections(_courseId, courseDoc) {
  if (!courseDoc) return courseDoc;

  const course = courseDoc.toObject ? courseDoc.toObject() : courseDoc;
  course.sections = Array.isArray(course.sections) ? course.sections : [];

  const lessons = await fetchLessonsForCourse(course);

  const bySection = (lessons || []).reduce((acc, l) => {
    const sid = String(l.sectionId || "");
    if (!sid) return acc;
    (acc[sid] ||= []).push({
      _id: l._id,
      title: l.title,
      type: l.type,
      duration: l.duration || 0,
      videoKey: l.videoKey || null,
      fileKey: l.fileKey || null,
      fileUrl: l.fileUrl || "",
      videoUrl: l.videoUrl || "",
      status: l.status || "draft",
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
      sectionId: sid,
    });
    return acc;
  }, {});

  for (const s of course.sections) {
    s.lessons = bySection[String(s._id)] || [];
  }

  const sectionIds = new Set(course.sections.map((s) => String(s._id)));
  const orphans = (lessons || []).filter(
    (l) => l.sectionId && !sectionIds.has(String(l.sectionId))
  );
  if (orphans.length) {
    const unassignedId = `unassigned-${String(course._id).slice(0, 8)}`;
    let unassigned = course.sections.find((s) => s._id === unassignedId);
    if (!unassigned) {
      unassigned = { _id: unassignedId, title: "Unassigned", lessons: [] };
      course.sections.push(unassigned);
    }
    unassigned.lessons.push(
      ...orphans.map((l) => ({
        _id: l._id,
        title: l.title,
        type: l.type,
        duration: l.duration || 0,
        videoKey: l.videoKey || null,
        fileKey: l.fileKey || null,
        fileUrl: l.fileUrl || "",
        videoUrl: l.videoUrl || "",
        status: l.status || "draft",
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
        sectionId: String(l.sectionId || ""),
      }))
    );
  }

  return course;
}

/* ---------------- Health/debug (same) ---------------- */
router.get("/_health", (req, res) => {
  res.json({ ok: true, where: "courses router" });
});

router.get("/noauth/:val", async (req, res) => {
  try {
    const cdoc = await loadCourseByIdOrKey(req.params.val);
    if (!cdoc) return res.status(404).json({ message: "Course not found" });
    const course = await hydrateLessonsIntoSections(String(cdoc._id), cdoc);
    res.json({ course });
  } catch (e) {
    res.status(500).json({ message: "Server error", detail: e.message });
  }
});

router.get("/debug/:val", async (req, res) => {
  try {
    const cdoc = await loadCourseByIdOrKey(req.params.val);
    if (!cdoc) return res.status(404).json({ ok: false, reason: "course-not-found" });
    res.json({
      ok: true,
      courseId: String(cdoc._id),
      slug: cdoc.slug,
      sectionCount: Array.isArray(cdoc.sections) ? cdoc.sections.length : 0,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* ---------------- ADMIN ROUTES (unchanged logic) ---------------- */
router.post(
  "/create-course",
  authAccess,
  requireRoles(["SuperAdmin", "Admin", "Teacher"]),
  async (req, res) => {
    try {
      const {
        title,
        price,
        isFree,
        status,
        instituteId,
        imageBase64,
        imageContentType,
        imageFilename,
      } = req.body;

      if (!title) return res.status(400).json({ message: "Title is required" });
      if (price && Number(price) < 0)
        return res.status(400).json({ message: "Price cannot be negative" });

      const slugify = (str) =>
        String(str).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
      const slug = slugify(title);

      const existing = await Courses.findOne({ slug });
      if (existing) {
        return res
          .status(400)
          .json({ message: `Course "${title}" already exists.` });
      }

      let imageUrl = null;
      if (imageBase64) {
        imageUrl = await uploadToS3(imageBase64, imageContentType, imageFilename);
      }

      const coursePayload = {
        title: title.trim(),
        slug,
        price: String(isFree) === "true" || isFree === true ? 0 : Number(price || 0),
        isFree: String(isFree) === "true" || isFree === true,
        status: status || "unpublished",
        createdBy: req.user.id,
        instituteId: instituteId || null,
        image: imageUrl,
        sections: [],
      };

      const course = new Courses(coursePayload);
      await course.save();

      res.status(201).json({ message: "Course created successfully", course });
    } catch (err) {
      console.error("❌ Course creation error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* Full course (hydrate lessons) */
router.get("/:courseId/full", authAccess, async (req, res) => {
  try {
    const { courseId } = req.params;

    const courseDoc = await Courses.findById(courseId);
    if (!courseDoc) return res.status(404).json({ message: "Course not found" });

    const course = await hydrateLessonsIntoSections(courseId, courseDoc);
    return res.json({ course });
  } catch (err) {
    console.error("❌ Full course fetch error:", err);
    return res.status(500).json({ message: "Server error", detail: err.message });
  }
});

/* Fetch by id or slug (hydrate lessons) */
router.get("/:courseId", authAccess, async (req, res) => {
  try {
    const cdoc = await loadCourseByIdOrKey(req.params.courseId);
    if (!cdoc) return res.status(404).json({ message: "Course not found" });

    const course = await hydrateLessonsIntoSections(String(cdoc._id), cdoc);
    res.json({ course });
  } catch (err) {
    console.error("❌ Course fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* Explicit fallback (hydrate lessons) */
router.get("/fetchCourse/by/:courseId", authAccess, async (req, res) => {
  try {
    const { courseId } = req.params;

    const courseDoc = await Courses.findById(courseId);
    if (!courseDoc) return res.status(404).json({ message: "Course not found" });

    const course = await hydrateLessonsIntoSections(courseId, courseDoc);
    res.json({ course });
  } catch (err) {
    console.error("❌ Fallback fetchCourse error:", err);
    res.status(500).json({ message: "Server error", detail: err.message });
  }
});

/* Add Section */
router.post("/:courseId/add-section", authAccess, requireRoles(["Admin", "Teacher"]), async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || title.trim() === "")
      return res.status(400).json({ message: "Section title is required" });

    const course = await Courses.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const newSection = { _id: uuidv4(), title: title.trim(), lessons: [] };
    course.sections.push(newSection);
    await course.save();

    res.status(200).json({ message: "Section added", section: newSection });
  } catch (err) {
    console.error("❌ Add section error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* Update Section Title */
router.put("/:courseId/section/:sectionId", authAccess, requireRoles(["Admin", "Teacher"]), async (req, res) => {
  try {
    const { title } = req.body;
    const course = await Courses.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const section = course.sections.find((s) => String(s._id) === String(req.params.sectionId));
    if (!section) return res.status(404).json({ message: "Section not found" });

    section.title = title.trim();
    await course.save();

    res.json({ message: "Section updated", section });
  } catch (err) {
    console.error("❌ Update section error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* Delete Section */
router.delete("/:courseId/section/:sectionId", authAccess, requireRoles(["Admin", "Teacher"]), async (req, res) => {
  try {
    const course = await Courses.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    course.sections = course.sections.filter(
      (s) => String(s._id) !== req.params.sectionId
    );
    await course.save();

    res.json({ message: "Section deleted successfully" });
  } catch (err) {
    console.error("❌ Delete section error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* Toggle Publish */
/* Toggle Publish */
router.patch("/:courseId/publish", authAccess, requireRoles(["Admin", "Teacher"]), async (req, res) => {
  try {
    const course = await Courses.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    course.status = course.status === "published" ? "unpublished" : "published";
    await course.save();

    res.json({ message: "Publish status updated", course });
  } catch (err) {
    console.error("❌ Publish error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- Update Course Cover Image (FormData upload) ---------------- */
router.patch(
  "/:courseId/cover",
  authAccess,
  requireRoles(["SuperAdmin", "Admin", "Teacher"]),
  upload.single("image"),
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const file = req.file;
      if (!file) return res.status(400).json({ message: "No image file uploaded" });

      const course = await Courses.findById(courseId);
      if (!course) return res.status(404).json({ message: "Course not found" });

      const key = `courses/${uuidv4()}-${file.originalname}`;
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );

      const imageUrl = `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      course.image = imageUrl;
      await course.save();

      res.json({
        message: "Cover image updated successfully",
        course,
      });
    } catch (err) {
      console.error("❌ Cover update error:", err);
      res.status(500).json({
        message: "Failed to update cover image",
        detail: err.message,
      });
    }
  }
);


/* List (admin sees all, student sees published) */
router.get("/student-visible-courses", authAccess, async (req, res) => {
  try {
    const courses = await Courses.find({ status: "published" });
    res.json({ courses });
  } catch (err) {
    console.error("❌ Fetch published error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/", authAccess, async (req, res) => {
  try {
    const role  = String(req.user?.role || "").toLowerCase();
    const query = role === "student" ? { status: "published" } : {};

    const courseDocs = await Courses.find(query);

    const courses = await Promise.all(
      (courseDocs || []).map(async (doc) => {
        const c = doc && doc.toObject ? doc.toObject() : doc || {};
        c.sections = Array.isArray(c.sections) ? c.sections : [];
        for (const s of c.sections) s.lessons = Array.isArray(s.lessons) ? s.lessons : [];
        return hydrateLessonsIntoSections(String(c._id), c);
      })
    );

    res.json({ courses });
  } catch (err) {
    console.error("❌ List courses error:", err?.message, err?.stack);
    res.status(500).json({ message: "Server error", detail: err?.message });
  }
});

/* ---------------- NEW: Delete entire Course (cascade lessons/sections) ---------------- */
router.delete(
  "/:courseId",
  authAccess,
  requireRoles(["SuperAdmin", "Admin", "Teacher"]),
  async (req, res) => {
    try {
      const { courseId } = req.params;

      // Load course by id or slug using existing helper
      const courseDoc = await loadCourseByIdOrKey(courseId);
      if (!courseDoc) {
        return res.status(404).json({ success: false, message: "Course not found" });
      }

      const cid  = String(courseDoc._id);
      const slug = String(courseDoc.slug || "").toLowerCase();

      // 1) Try to delete lessons if a separate Lesson collection exists
      try {
        if (Lesson && typeof Lesson.deleteMany === "function") {
          await Lesson.deleteMany({
            $or: [
              { courseId: cid },
              { courseId: courseDoc._id },
              { courseSlug: slug },
              { courseKey: slug },
            ],
          });
        } else if (Lesson && typeof Lesson.removeByCourseId === "function") {
          await Lesson.removeByCourseId(cid);
        }
      } catch (e) {
        console.warn("Lessons cascade delete warning:", e?.message);
      }

      // 2) If lessons are embedded, clear sections (safe no-op otherwise)
      try {
        if (Array.isArray(courseDoc.sections)) {
          courseDoc.sections = [];
          await courseDoc.save();
        }
      } catch (e) {
        console.warn("Section cleanup warning:", e?.message);
      }

      // 3) Delete the course itself
      await Courses.findByIdAndDelete(cid);

      return res.json({ success: true, message: "Course and related data deleted" });
    } catch (err) {
      console.error("❌ Delete course error:", err);
      return res.status(500).json({ success: false, message: "Server error", detail: err?.message });
    }
  }
);

module.exports = router;


