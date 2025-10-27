// routes/adminMockTests/repo.js
const { ddb } = require("../../../../../Services/aws/dynamo");
const { s3 } = require("../../../../../Services/aws/s3");

const MOCKTESTS_TABLE = process.env.MOCKTESTS_TABLE || "MockTests";
const MOCKTESTS_GSI_SLUG = process.env.MOCKTESTS_GSI_SLUG || "GSI_Slug";

/* ---------------------------- S3 helpers ---------------------------- */

function parseS3Uri(uri) {
  if (!uri || typeof uri !== "string") return null;
  const m = uri.match(/^s3:\/\/([^/]+)\/(.+)$/i);
  if (!m) return null;
  return { bucket: m[1], key: m[2] };
}

/** If imageUrl is s3://bucket/mocktests/<id>/cover.jpg -> parsed.json in same folder */
function inferParsedJsonLocationFromRecord(rec, mockTestId) {
  if (rec?.imageUrl) {
    const p = parseS3Uri(rec.imageUrl);
    if (p) {
      const parts = p.key.split("/");
      if (parts.length >= 2) {
        parts.pop(); // remove filename (e.g., cover.jpg)
        const base = parts.join("/");
        return { bucket: p.bucket, key: `${base}/parsed.json` };
      }
    }
  }
  // Fallback to env
  const bucket = process.env.MOCKS_BUCKET || process.env.S3_BUCKET;
  const prefix = process.env.MOCKS_PREFIX || "mocktests";
  return { bucket, key: `${prefix}/${mockTestId}/parsed.json` };
}

/* ----------------------------- DDB repo ----------------------------- */

async function getById(mockTestId) {
  const r = await ddb.get({ TableName: MOCKTESTS_TABLE, Key: { mockTestId } }).promise();
  return r.Item || null;
}

/**
 * Reads parsed.json for a mock. Tries to infer S3 location from the record’s imageUrl,
 * otherwise uses env (MOCKS_BUCKET/S3_BUCKET + MOCKS_PREFIX).
 * Returns null if not found or unreadable.
 */
async function getParsedJson(mockTestId) {
  try {
    const rec = await getById(mockTestId);
    if (!rec) return null;

    const { bucket, key } = inferParsedJsonLocationFromRecord(rec, mockTestId);
    if (!bucket || !key) return null;

    const obj = await s3.getObject({ Bucket: bucket, Key: key }).promise();
    return JSON.parse(obj.Body.toString("utf-8"));
  } catch (err) {
    console.error("[repo.getParsedJson] failed:", err);
    return null;
  }
}

async function getBySlug(slug) {
  const r = await ddb.query({
    TableName: MOCKTESTS_TABLE,
    IndexName: MOCKTESTS_GSI_SLUG,
    KeyConditionExpression: "#s = :v",
    ExpressionAttributeNames: { "#s": "slug" },
    ExpressionAttributeValues: { ":v": slug },
    Limit: 1,
  }).promise();
  return (r.Items && r.Items[0]) || null;
}

async function createMock(item) {
  await ddb.put({ TableName: MOCKTESTS_TABLE, Item: item }).promise();
  return item;
}

async function patchMock(mockTestId, patch) {
  const names = {};
  const values = {};
  const sets = [];

  Object.entries(patch).forEach(([k, v], i) => {
    names[`#k${i}`] = k;
    values[`:v${i}`] = v;
    sets.push(`#k${i} = :v${i}`);
  });

  if (!sets.length) return;

  await ddb.update({
    TableName: MOCKTESTS_TABLE,
    Key: { mockTestId },
    UpdateExpression: `SET ${sets.join(", ")}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  }).promise();
}

module.exports = {
  MOCKTESTS_TABLE,
  getById,
  getBySlug,
  createMock,
  patchMock,
  getParsedJson,
};
