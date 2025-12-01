/// server/routes/StudentModule/StudentMocktestRoute/studentMocktestFetch.js
const express = require("express");
const router = express.Router();

const { authAccess } = require("../../../../middleware/auth");

// ✅ Use global v3 Dynamo wrapper (pre-configured in Services/aws/dynamo.js)
const { ddb: dynamo } = require("../../../../Services/aws/dynamo");

// DynamoDB table containing mocktest definitions
const MOCKS_TABLE = process.env.MOCKTESTS_TABLE || "MockTests";

// 🔒 Protect all routes — user must be logged in
router.use(authAccess);

router.get("/mocktests", async (req, res) => {
  try {
    // -------------------------------------------------------------
    // 1) Ensure user exists — authAccess middleware should set req.user
    // -------------------------------------------------------------
    if (!req.user) {
      console.error("[student/mocktests] no req.user");
      return res.status(401).json({ error: "Unauthorized" });
    }

    // -------------------------------------------------------------
    // 2) Each student belongs to an institute. We filter mocktests by institute.
    // -------------------------------------------------------------
    const instituteId = req.user.instituteId;
    if (!instituteId) {
      console.error(
        "[student/mocktests] missing instituteId on user:",
        req.user
      );
      return res.status(400).json({ error: "No institute context" });
    }

    // -------------------------------------------------------------
    // 3) Validate table name is available (should always be defined)
    // -------------------------------------------------------------
    if (!MOCKS_TABLE) {
      console.error("[student/mocktests] MOCKS_TABLE undefined");
      return res
        .status(500)
        .json({ error: "Server misconfigured (MOCKS_TABLE)" });
    }

    // -------------------------------------------------------------
    // 4) Scan filter:
    //    - Only mocktests published (status = PUBLISHED)
    //    - Belongs to student's institute
    // -------------------------------------------------------------
    const params = {
      TableName: MOCKS_TABLE,
      FilterExpression: "#inst = :inst AND #st = :pub",
      ExpressionAttributeNames: { "#inst": "instituteId", "#st": "status" },
      ExpressionAttributeValues: { ":inst": instituteId, ":pub": "PUBLISHED" },
    };

    console.log("[student/mocktests] scanning", JSON.stringify(params));

    // -------------------------------------------------------------
    // 5) Dynamo scan — paginate until all items fetched
    //    (Scan is required because we filter on non-key attributes)
    // -------------------------------------------------------------
    let items = [];
    let page;
    do {
      page = await dynamo.scan(params).promise(); // v3 wrapper uses v2-style promise()
      items = items.concat(page.Items || []);

      // Continue scanning if DynamoDB returned a pagination token
      params.ExclusiveStartKey = page.LastEvaluatedKey;
    } while (page.LastEvaluatedKey);

    // -------------------------------------------------------------
    // 6) Clean output — only send needed fields to frontend
    // -------------------------------------------------------------
    const out = items.map((it) => ({
      mockTestId: it.mockTestId,               // unique test ID
      title: it.title,                         // display title
      price: typeof it.price === "number" ? it.price : 0,
      isFree: it.isFree === true || it.price === 0,
      status: it.status || "DRAFT",            // should always be PUBLISHED
      imageUrl: it.imageUrl || "",             // thumbnail
      totalQuestions: it.totalQuestions ?? null,
      duration: it.duration ?? null,           // test duration
      createdAt: it.createdAt || null,         // creation timestamp
    }));

    // -------------------------------------------------------------
    // 7) Send final structured response to the student
    // -------------------------------------------------------------
    return res.json({ items: out });
  } catch (e) {
    // -------------------------------------------------------------
    // 8) Error handling — log & send safe error response
    // -------------------------------------------------------------
    console.error("[student/mocktests] ERROR:", e);
    const code = e.code || e.name || "UnknownError";
    return res
      .status(500)
      .json({ error: "Failed to list mock tests", code, message: e.message });
  }
});

module.exports = router;
