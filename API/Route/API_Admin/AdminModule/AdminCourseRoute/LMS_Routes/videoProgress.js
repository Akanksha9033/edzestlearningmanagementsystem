// backend/LMS_Routes/videoProgress.js
const express = require("express");
const router = express.Router();
// ✅ Build a v2 DocumentClient here (no external client module needed)
const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.AWS_REGION || "ap-south-1" });
const ddb = new AWS.DynamoDB.DocumentClient();
// ✅ Correct path to your middleware from LMS_Routes/*
const { authAccess } = require("../../../../../middleware/auth.js");
const TABLE = process.env.DDB_VIDEO_PROGRESS || "studentprogress";
const COURSES_TABLE = process.env.DDB_COURSES_TABLE || "Courses";
const REGION = process.env.AWS_REGION || "ap-south-1";

// ---------- helpers ----------
const safeInt = (x) => (Number.isFinite(+x) ? +x : 0);
const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const calcPercent = (watchedSeconds, duration) => {
  const w = safeInt(watchedSeconds);
  const d = safeInt(duration);
  if (!d) return 0;
  return clamp(Math.round((w / d) * 100));
};

// ============================================================================
// ✅ PUT: Save or update user's video progress
// ============================================================================
router.put("/:lessonId", authAccess, async (req, res) => {
  const { lessonId } = req.params;
  const userId = req.user?.id || req.userId || req.body.userId;
  let { courseSlug, watchedSeconds, duration, percent, completed } = req.body || {};

  console.log("🟣 [VideoProgress PUT] Incoming:", {
    lessonId,
    userId,
    courseSlug,
    watchedSeconds,
    duration,
    percent,
    completed,
  });

  if (!userId || !lessonId) {
    return res.status(400).json({ message: "Missing userId or lessonId" });
  }

  try {
    // ✅ Normalize watchedSeconds, duration, percent properly
    watchedSeconds = safeInt(watchedSeconds);
    duration = safeInt(duration);

    // Fallback: if frontend sends duration=0 but we have watchedSeconds
    if (!duration || duration <= 0) {
      duration = safeInt(req.body?.videoDuration || watchedSeconds || 0);
    }
   
    // Recalculate percent only if not given or invalid
    if (!Number.isFinite(percent) || percent <= 0) {
      percent = calcPercent(watchedSeconds, duration);
    }

    percent = clamp(percent);
    completed = completed === true || percent >= 95;

    // 🟢 Debug print
    console.log("🎯 Normalized progress values:", {
      watchedSeconds,
      duration,
      percent,
      completed,
    });

    const studentprogressid = `${userId}#${lessonId}`;

    // ✅ Perform DynamoDB update
    const result = await ddb
      .update({
        TableName: TABLE,
        Key: { studentprogressid },
        UpdateExpression: `
          SET userId = :u,
              lessonId = :l,
              courseSlug = :cs,
              watchedSeconds = :ws,
              #dur = :dur,
              #p = :p,
              completed = :c,
              updatedAt = :now
        `,
        ExpressionAttributeNames: { "#dur": "duration", "#p": "percent" },
        ExpressionAttributeValues: {
          ":u": userId,
          ":l": lessonId,
          ":cs": courseSlug || null,
          ":ws": watchedSeconds,
          ":dur": duration,
          ":p": percent,
          ":c": !!completed,
          ":now": Date.now(),
        },
        ReturnValues: "ALL_NEW",
      })
      .promise();

    console.log("✅ [VideoProgress] Updated:", result.Attributes);

    return res.json({
      ok: true,
      studentprogressid,
      userId,
      lessonId,
      courseSlug,
      watchedSeconds, // ✅ include this in response
      duration,       // ✅ include this in response
      percent,
      completed,
    });
  } catch (err) {
    console.error("🔥 [VideoProgress][PUT ERROR]", err);
    return res.status(500).json({
      message: "Failed to update video progress",
      error: err.message,
    });
  }
});


// ============================================================================
// ✅ GET: Single lesson progress
// ============================================================================
// ============================================================================
// ✅ GET: Single lesson progress (UPDATED for resume support)
// ============================================================================
router.get("/", authAccess, async (req, res) => {
  const { lessonId, courseSlug } = req.query;
  const userId = req.user?.id || req.userId || req.body.userId;

  if (!userId || !lessonId) {
    return res.status(400).json({ message: "Missing userId or lessonId" });
  }

  try {
    const studentprogressid = `${userId}#${lessonId}`;
    const result = await ddb
      .get({
        TableName: TABLE,
        Key: { studentprogressid },
      })
      .promise();

    const item = result.Item || {};

    // ✅ FIXED: Always return the saved watchedSeconds value
    const resumeTime = Number(item.watchedSeconds || 0);

    const data = {
      userId,
      lessonId,
      courseSlug: item.courseSlug || courseSlug || null,
      percent: item.percent || 0,
      completed: !!item.completed,
      watchedSeconds: item.watchedSeconds || 0,
      duration: item.duration || 0,
      updatedAt: item.updatedAt || null,
      currentTime: resumeTime, // ✅ now same as watchedSeconds
    };

    console.log("📤 [VideoProgress][GET] Returning:", data);

    return res.json({ ok: true, data });
  } catch (err) {
    console.error("🔥 [VideoProgress][GET ERROR]", err);
    return res.status(500).json({
      message: "Failed to fetch video progress",
      error: err.message,
    });
  }
});




// ============================================================================
// ✅ GET: Course-wide progress (strictly completed ÷ totalLessons)
// ============================================================================
router.get("/course/:courseSlug", authAccess, async (req, res) => {
  const { courseSlug } = req.params;
  const userId = req.user?.id || req.userId || req.body.userId;

  if (!userId || !courseSlug)
    return res.status(400).json({ message: "Missing userId or courseSlug" });

  try {
    // 1️⃣ Fetch user’s watched/completed items
    const scanRes = await ddb
      .scan({
        TableName: TABLE,
        FilterExpression: "userId = :u AND courseSlug = :c",
        ExpressionAttributeValues: { ":u": userId, ":c": courseSlug },
      })
      .promise();

    const items = scanRes.Items || [];
    const completedLessonIds = items.filter((i) => i.completed === true).map((i) => i.lessonId);
    const completedCount = completedLessonIds.length;

    // 2️⃣ Fetch actual total lessons from Course table
    let totalLessons = 0;
    try {
      const courseRes = await ddb
        .get({ TableName: COURSES_TABLE, Key: { slug: courseSlug } })
        .promise();
      const course = courseRes.Item;
      if (course && Array.isArray(course.sections)) {
        totalLessons = course.sections.reduce(
          (sum, s) => sum + (Array.isArray(s.lessons) ? s.lessons.length : 0),
          0
        );
      }
    } catch (e) {
      console.warn("⚠️ [VideoProgress] Could not read from Course table:", e.message);
    }

    // 3️⃣ Never let totalLessons fall back to watched lessons count
    if (!totalLessons || totalLessons <= 0) {
      console.warn("⚠️ Course totalLessons missing — defaulting to safe fallback = 1");
      totalLessons = 1;
    }

    // 4️⃣ Compute strict completion ratio
    const percent = clamp(Math.round((completedCount / totalLessons) * 100));

    console.log("📊 [Course Progress]", {
      courseSlug,
      userId,
      totalLessons,
      completedCount,
      percent,
      completedLessonIds,
    });

    return res.json({
      ok: true,
      userId,
      courseSlug,
      totalLessons,
      completedLessons: completedCount,
      percent,
      completedLessonIds,
    });
  } catch (err) {
    console.error("🔥 [VideoProgress][GET course ERROR]", err);
    return res.status(500).json({ message: "Failed to fetch course progress", error: err.message });
  }
});

module.exports = router;
