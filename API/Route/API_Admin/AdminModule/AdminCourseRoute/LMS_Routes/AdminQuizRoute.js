const express = require("express");
const router = express.Router();

const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

AWS.config.update({ region: process.env.AWS_REGION || "ap-south-1" });
const ddb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.DDB_LESSONS_TABLE || "edzest_lms";

/**
 * QUIZ SAVE API (Create + Update)
 * --------------------------------
 * If lessonId = "new" → create new lesson
 * If lessonId exists → update that same quiz lesson
 */

router.post("/quiz", async (req, res) => {
  try {
    const { courseId, sectionId, lessonId, title, questions } = req.body;

    // -----------------------------------
    // Basic validation
    // -----------------------------------
    if (!courseId || !sectionId || !title || !Array.isArray(questions)) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // -----------------------------------
    // Determine final lessonId
    // -----------------------------------
    const finalLessonId =
      lessonId && lessonId !== "new" ? lessonId : uuidv4();

    const timestamp = new Date().toISOString();

    // -----------------------------------
    // Build final item to save
    // -----------------------------------
    const item = {
      pk: `COURSE#${courseId}`,
      sk: `LESSON#${finalLessonId}`,
      _id: finalLessonId,

      courseId,
      sectionId,
      title,
      type: "quiz",
      entity: "lesson",

      questions,

      createdAt: timestamp,
      updatedAt: timestamp,
      duration: 0,
      createdBy: "admin",
    };

    console.log("🧠 Saving/Updating Quiz Lesson:", item);

    // -----------------------------------
    // Save/Update to DynamoDB
    // -----------------------------------
    await ddb
      .put({
        TableName: TABLE_NAME,
        Item: item,
      })
      .promise();

    // -----------------------------------
    // Final Response
    // -----------------------------------
    return res.json({
      ok: true,
      message: "Quiz saved successfully!",
      lessonId: finalLessonId,
    });
  } catch (err) {
    console.error("🔥 QUIZ SAVE ERROR:", err);
    return res.status(500).json({
      message: "Failed to save quiz",
      error: err.message,
    });
  }
});
//--------------------------------------------
// UPDATE QUIZ (PUT)
//--------------------------------------------
router.put("/quiz/:lessonId", async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { courseId, sectionId, title, questions } = req.body;

    if (!courseId || !sectionId || !title || !Array.isArray(questions)) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const timestamp = new Date().toISOString();

    const item = {
      pk: `COURSE#${courseId}`,
      sk: `LESSON#${lessonId}`,
      _id: lessonId,

      courseId,
      sectionId,
      title,
      type: "quiz",
      entity: "lesson",
      questions,
      updatedAt: timestamp
    };

    console.log("📝 Updating Quiz:", item);

    await ddb.put({
      TableName: TABLE_NAME,
      Item: item,
    }).promise();

    return res.json({
      ok: true,
      message: "Quiz updated successfully",
      lessonId,
    });

  } catch (err) {
    console.error("🔥 QUIZ UPDATE ERROR:", err);
    return res.status(500).json({
      message: "Failed to update quiz",
      error: err.message,
    });
  }
});


/**
 * GET QUIZ LESSON BY ID
 * ----------------------
 * This endpoint loads 1 quiz lesson so that frontend can edit it.
 */
router.get("/quiz/:courseId/:lessonId", async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;

    const key = {
      pk: `COURSE#${courseId}`,
      sk: `LESSON#${lessonId}`,
    };

    const result = await ddb
      .get({
        TableName: TABLE_NAME,
        Key: key,
      })
      .promise();

    if (!result || !result.Item) {
      return res.status(404).json({ message: "Quiz lesson not found" });
    }

    return res.json({
      ok: true,
      lesson: result.Item,
    });
  } catch (err) {
    console.error("🔥 QUIZ GET ERROR:", err);
    return res.status(500).json({
      message: "Failed to fetch quiz",
      error: err.message,
    });
  }
});



module.exports = router;
