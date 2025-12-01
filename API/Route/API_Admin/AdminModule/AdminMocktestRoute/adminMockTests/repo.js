// routes/adminMockTests/repo.js

// DynamoDB DocumentClient (v3 wrapper returning v2-like ddb)
const { ddb } = require("../../../../../Services/aws/dynamo");

// ⭐ Bring real v3 S3 client + commands
const { s3 } = require("../../../../../Services/aws/s3");
const {
  GetObjectCommand,
} = require("@aws-sdk/client-s3");

// DynamoDB table + GSI names
const MOCKTESTS_TABLE = process.env.MOCKTESTS_TABLE || "MockTests";
const MOCKTESTS_GSI_SLUG = process.env.MOCKTESTS_GSI_SLUG || "GSI_Slug";

/* ========================================================================
   🔹 S3 HELPERS
   These help figure out:
   - bucket name
   - folder path
   - parsed.json location
   ======================================================================== */

/**
 * ✔ parse an S3 URI like:
 *      s3://my-bucket/path/to/file.jpg
 *   and return:
 *      { bucket: "my-bucket", key: "path/to/file.jpg" }
 */
function parseS3Uri(uri) {
  if (!uri || typeof uri !== "string") return null;
  const m = uri.match(/^s3:\/\/([^/]+)\/(.+)$/i);
  if (!m) return null;
  return { bucket: m[1], key: m[2] };
}

/**
 * ✔ Infer where `parsed.json` is located
 * Logic:
 *    If record has imageUrl like:
 *        s3://bucket/mocktests/1234/cover.jpg
 *    Then parsed.json is:
 *        mocktests/1234/parsed.json
 *
 * If not found → fall back to:
 *      MOCKS_BUCKET or S3_BUCKET + "mocktests/<id>/parsed.json"
 */
function inferParsedJsonLocationFromRecord(rec, mockTestId) {
  // If imageUrl exists, use it to derive folder path
  if (rec?.imageUrl) {
    const p = parseS3Uri(rec.imageUrl);
    if (p) {
      const parts = p.key.split("/");
      if (parts.length >= 2) {
        parts.pop(); // remove file name
        const base = parts.join("/");
        return { bucket: p.bucket, key: `${base}/parsed.json` };
      }
    }
  }

  // Fallback bucket + prefix
  const bucket = process.env.MOCKS_BUCKET || process.env.S3_BUCKET;
  const prefix = process.env.MOCKS_PREFIX || "mocktests";

  return { bucket, key: `${prefix}/${mockTestId}/parsed.json` };
}

/* ========================================================================
   🔹 DYNAMODB REPOSITORY FUNCTIONS
   These functions talk directly with DynamoDB.
   ======================================================================== */

/**
 * ✔ Get mockTest by ID
 */
async function getById(mockTestId) {
  const r = await ddb
    .get({ TableName: MOCKTESTS_TABLE, Key: { mockTestId } })
    .promise();

  return r.Item || null;
}

/**
 * ✔ Read parsed.json from S3 using AWS SDK v3
 * Returns { rows, summary } or null if missing.
 */
async function getParsedJson(mockTestId) {
  try {
    const rec = await getById(mockTestId);
    if (!rec) return null;

    // Extract bucket + key
    const { bucket, key } = inferParsedJsonLocationFromRecord(rec, mockTestId);
    if (!bucket || !key) return null;

    // ⭐ Correct AWS SDK v3 call
    const data = await s3.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    // Convert stream → string
    const text = await data.Body.transformToString();
    return JSON.parse(text);
  } catch (err) {
    console.error("[repo.getParsedJson] failed:", err);
    return null;
  }
}

/**
 * ✔ Get mock test by slug using GSI
 */
async function getBySlug(slug) {
  const r = await ddb
    .query({
      TableName: MOCKTESTS_TABLE,
      IndexName: MOCKTESTS_GSI_SLUG,
      KeyConditionExpression: "#s = :v",
      ExpressionAttributeNames: { "#s": "slug" },
      ExpressionAttributeValues: { ":v": slug },
      Limit: 1,
    })
    .promise();

  return (r.Items && r.Items[0]) || null;
}

/**
 * ✔ Create a mock test (simple put)
 */
async function createMock(item) {
  await ddb
    .put({
      TableName: MOCKTESTS_TABLE,
      Item: item,
    })
    .promise();

  return item;
}

/**
 * ✔ Patch/Update mock test (dynamic update expression)
 * Builds:
 *   SET #k0 = :v0, #k1 = :v1, ...
 */
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

  await ddb
    .update({
      TableName: MOCKTESTS_TABLE,
      Key: { mockTestId },
      UpdateExpression: `SET ${sets.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    })
    .promise();
}

/* ========================================================================
   ✔ EXPORTS
   ======================================================================== */
module.exports = {
  MOCKTESTS_TABLE,
  getById,
  getBySlug,
  createMock,
  patchMock,
  getParsedJson,
};
