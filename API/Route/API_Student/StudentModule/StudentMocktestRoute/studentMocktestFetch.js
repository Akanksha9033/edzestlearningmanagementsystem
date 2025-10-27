// server/routes/student.mocktests.routes.js
const express = require("express");
const router = express.Router();

const { authAccess } = require("../../../../middleware/auth");
const AWS = require("../../../../Services/aws/config");
const { DocumentClient } = require("aws-sdk/clients/dynamodb");
const ddb = new DocumentClient({ service: new AWS.DynamoDB() });

const MOCKS_TABLE = process.env.MOCKTESTS_TABLE || "MockTests";

router.use(authAccess);

router.get("/mocktests", async (req, res) => {
  try {
    // 1) verify auth + institute
    if (!req.user) {
      console.error("[student/mocktests] no req.user");
      return res.status(401).json({ error: "Unauthorized" });
    }
    const instituteId = req.user.instituteId;
    if (!instituteId) {
      console.error("[student/mocktests] missing instituteId on user:", req.user);
      return res.status(400).json({ error: "No institute context" });
    }

    // 2) verify table name
    if (!MOCKS_TABLE) {
      console.error("[student/mocktests] MOCKS_TABLE undefined");
      return res.status(500).json({ error: "Server misconfigured (MOCKS_TABLE)" });
    }

    // 3) scan with filter
    const params = {
      TableName: MOCKS_TABLE,
      FilterExpression: "#inst = :inst AND #st = :pub",
      ExpressionAttributeNames: { "#inst": "instituteId", "#st": "status" },
      ExpressionAttributeValues: { ":inst": instituteId, ":pub": "PUBLISHED" },
      // ProjectionExpression optional; comment it out if you suspect issues
      // ProjectionExpression: "mockTestId, title, price, isFree, status, imageUrl, totalQuestions, duration, createdAt",
    };

    console.log("[student/mocktests] scanning", JSON.stringify(params));

    let items = [];
    let page;
    do {
      page = await ddb.scan(params).promise();
      items = items.concat(page.Items || []);
      params.ExclusiveStartKey = page.LastEvaluatedKey;
    } while (page.LastEvaluatedKey);

    const out = items.map((it) => ({
      mockTestId: it.mockTestId,
      title: it.title,
      price: typeof it.price === "number" ? it.price : 0,
      isFree: it.isFree === true || it.price === 0,
      status: it.status || "DRAFT",
      imageUrl: it.imageUrl || "",
      totalQuestions: it.totalQuestions ?? null,
      duration: it.duration ?? null,
      createdAt: it.createdAt || null,
    }));

    return res.json({ items: out });
  } catch (e) {
    console.error("[student/mocktests] ERROR:", e);
    const code = e.code || e.name || "UnknownError";
    return res.status(500).json({ error: "Failed to list mock tests", code, message: e.message });
  }
});

module.exports = router;
