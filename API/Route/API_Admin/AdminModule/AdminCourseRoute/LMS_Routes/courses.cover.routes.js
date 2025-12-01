// API/Route/API_Admin/AdminModule/AdminCourseRoute/LMS_Routes/courses.routes.js
const express = require("express");
const router = express.Router();

// --- AWS SDK v3 GLOBAL WRAPPER (no aws-sdk v2) ---
const {
  ddb,
  GetCommand,
  UpdateCommand
} = require("../../../../../Services/aws/dynamo");

/* ─────────── ENV / CONFIG ─────────── */
const DDB_TABLE = process.env.DDB_COURSES || "edzest_lms";

const COURSE_PK_PREFIX = process.env.COURSE_PK_PREFIX || "COURSE#";
const COURSE_SK_VALUE  = process.env.COURSE_SK_VALUE  || "COURSE";

/* Build Key from courseId */
function buildCourseKey(courseId) {
  return { pk: `${COURSE_PK_PREFIX}${courseId}`, sk: COURSE_SK_VALUE };
}

/* Normalize course object for FE (cover fallbacks) */
function mapCourse(Item) {
  if (!Item) return null;
  return {
    ...Item,
    coverImage:
      Item.coverUrl ||
      Item.imageUrl ||
      Item.thumbnailUrl ||
      null,
    coverUrl: Item.coverUrl || null,
    imageUrl: Item.imageUrl || null,
    thumbnailUrl: Item.thumbnailUrl || null,
    coverKey: Item.coverKey || null,
  };
}

/* ─────────── GET /:id ─────────── */
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const Key = buildCourseKey(id);

    const out = await ddb.get({
      TableName: DDB_TABLE,
      Key
    }).promise();

    if (!out.Item) return res.status(404).json({ error: "Not found" });

    return res.json({ course: mapCourse(out.Item) });
  } catch (e) {
    console.error("GET /:id error:", e);
    return res.status(500).json({ error: "Server error", detail: e.message });
  }
});

/* ─────────── PUT /:id/meta ─────────── */
router.put("/:id/meta", async (req, res) => {
  try {
    const id = req.params.id;
    const Key = buildCourseKey(id);

    const payload = req.body || {};
    const allowed = ["title", "price", "subtitle", "shortDesc", "longDesc"];

    const names = { "#updatedAt": "updatedAt" };
    const values = { ":updatedAt": Date.now() };
    const sets = ["#updatedAt = :updatedAt"];

    for (const k of allowed) {
      if (payload[k] !== undefined) {
        names[`#${k}`] = k;
        values[`:${k}`] = payload[k];
        sets.push(`#${k} = :${k}`);
      }
    }

    const out = await ddb.update({
      TableName: DDB_TABLE,
      Key,
      UpdateExpression: `SET ${sets.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    }).promise();

    return res.json({ ok: true, course: mapCourse(out.Attributes) });
  } catch (e) {
    console.error("PUT /:id/meta error:", e);
    return res.status(500).json({ error: "Server error", detail: e.message });
  }
});

/* ─────────── PATCH /:id/publish ─────────── */
router.patch("/:id/publish", async (req, res) => {
  try {
    const id = req.params.id;
    const Key = buildCourseKey(id);

    const outGet = await ddb.get({ TableName: DDB_TABLE, Key }).promise();
    if (!outGet.Item) return res.status(404).json({ error: "Not found" });

    const cur = String(outGet.Item.status || "").toLowerCase();
    const next = cur === "published" || cur === "live" ? "unpublished" : "published";

    const out = await ddb.update({
      TableName: DDB_TABLE,
      Key,
      UpdateExpression: "SET #status = :s, #updatedAt = :t",
      ExpressionAttributeNames: { "#status": "status", "#updatedAt": "updatedAt" },
      ExpressionAttributeValues: { ":s": next, ":t": Date.now() },
      ReturnValues: "ALL_NEW",
    }).promise();

    return res.json({ ok: true, course: mapCourse(out.Attributes) });
  } catch (e) {
    console.error("PATCH /:id/publish error:", e);
    return res.status(500).json({ error: "Server error", detail: e.message });
  }
});

/* ─────────── POST /:id/schedule ─────────── */
router.post("/:id/schedule", async (req, res) => {
  try {
    const id = req.params.id;
    const Key = buildCourseKey(id);

    const publishAt = req.body?.publishAt ?? null;
    const scheduledUnpublishAt = req.body?.scheduledUnpublishAt ?? null;

    const names = { "#updatedAt": "updatedAt" };
    const values = { ":updatedAt": Date.now() };
    const sets = ["#updatedAt = :updatedAt"];

    if (publishAt !== undefined) {
      names["#publishAt"] = "publishAt";
      values[":publishAt"] = publishAt;
      sets.push("#publishAt = :publishAt");
    }

    if (scheduledUnpublishAt !== undefined) {
      names["#scheduledUnpublishAt"] = "scheduledUnpublishAt";
      values[":scheduledUnpublishAt"] = scheduledUnpublishAt;
      sets.push("#scheduledUnpublishAt = :scheduledUnpublishAt");
    }

    const out = await ddb.update({
      TableName: DDB_TABLE,
      Key,
      UpdateExpression: `SET ${sets.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    }).promise();

    return res.json({ ok: true, course: mapCourse(out.Attributes) });
  } catch (e) {
    console.error("POST /:id/schedule error:", e);
    return res.status(500).json({ error: "Server error", detail: e.message });
  }
});

module.exports = router;
