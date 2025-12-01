// backend/dynamo/ebooksRepo.js

// 👉 Import your shared DynamoDB DocumentClient (configured in ./client.js)
// This allows you to call ddb.get(), ddb.put(), ddb.patch(), etc.
const { ddb } = require("./client"); // ✅ Use shared DynamoDB DocumentClient

// 👉 Table name for storing E-Books.
// If ENV variable DDB_EBOOKS is not provided → fallback to "e-book"
const TABLE = process.env.DDB_EBOOKS || "e-book";

// 👉 GSIs created in your DynamoDB table
// GSI_DATE:   used for listing ebooks by institute + createdAt
// GSI_SLUG:   used for finding ebook by (instituteId, slug)
const GSI_DATE = "byInstituteDate"; // (instituteId, createdAt)
const GSI_SLUG = "byInstituteSlug"; // (instituteId, slug)

/**
 * Create a new e-book
 * @param {Object} item - Full eBook item with ebookid, instituteId, slug, etc.
 */
async function createEBook(item) {
  const params = {
    TableName: TABLE,
    Item: item,
    // 👉 Ensure the ebookid does NOT already exist (avoid duplicates)
    ConditionExpression: "attribute_not_exists(ebookid)",
  };
  await ddb.put(params).promise();
  return item; // return the created ebook
}

/**
 * Get e-book by ID (Primary Key)
 * Super fast because it uses direct PK lookup
 */
async function getById(ebookid) {
  const out = await ddb
    .get({
      TableName: TABLE,
      Key: { ebookid }, // PK = ebookid
    })
    .promise();

  // 👉 return the ebook object OR null if not found
  return out.Item || null;
}

/**
 * Get e-book by Institute + Slug (GSI)
 * Used for SEO-friendly routing like: /ebooks/<slug>
 */
async function getByInstituteAndSlug(instituteId, slug) {
  const out = await ddb
    .query({
      TableName: TABLE,
      IndexName: GSI_SLUG, // GSI on (instituteId, slug)
      KeyConditionExpression: "instituteId = :i AND #slug = :s",
      ExpressionAttributeValues: {
        ":i": instituteId,
        ":s": slug,
      },
      // 👉 slug is a reserved keyword, so we alias it as #slug
      ExpressionAttributeNames: {
        "#slug": "slug",
      },
      Limit: 1, // only 1 ebook per slug per institute
    })
    .promise();

  return out.Items?.[0] || null; // return first result or null
}

/**
 * List all e-books for a given institute
 * Supports:
 *   ✔ Pagination (cursor)
 *   ✔ Sorting (newest first)
 *   ✔ Filtering by status (draft/published)
 */
async function listByInstitute(instituteId, opts = {}) {
  const { status, limit = 20, cursor, descending = true } = opts;

  const params = {
    TableName: TABLE,
    IndexName: GSI_DATE, // GSI on (instituteId, createdAt)
    KeyConditionExpression: "instituteId = :i",
    ExpressionAttributeValues: { ":i": instituteId },
    // 👉 ScanIndexForward=false => newest → oldest
    ScanIndexForward: !descending,
    Limit: limit,
  };

  // 👉 Add pagination cursor if provided
  if (cursor) params.ExclusiveStartKey = cursor;

  // 👉 Optional filter for status (Draft, Published, etc.)
  if (status) {
    params.FilterExpression = "#status = :s";
    params.ExpressionAttributeNames = {
      ...(params.ExpressionAttributeNames || {}),
      "#status": "status",
    };
    params.ExpressionAttributeValues[":s"] = status;
  }

  const out = await ddb.query(params).promise();

  // 👉 Return list + next cursor for pagination
  return { items: out.Items || [], cursor: out.LastEvaluatedKey || null };
}

/**
 * Update e-book fields dynamically (PATCH)
 * Only fields provided in "patch" will be updated.
 */
async function updateEBook(ebookid, patch = {}) {
  // 👉 Allowed updatable fields
  const fields = [
    "title",
    "slug",
    "coverImage",
    "chapters",
    "tags",
    "status",
    "authorId",
    "instituteId",
    "meta",
  ];

  const names = {};  // ExpressionAttributeNames
  const values = {}; // ExpressionAttributeValues
  const sets = [];   // SET clauses

  // 👉 Add only fields that were provided in `patch`
  fields.forEach((k) => {
    if (patch[k] !== undefined) {
      names["#" + k] = k;
      values[":" + k] = patch[k];
      sets.push(`#${k} = :${k}`);
    }
  });

  // 👉 Always update updatedAt timestamp
  names["#updatedAt"] = "updatedAt";
  values[":updatedAt"] = new Date().toISOString();
  sets.push("#updatedAt = :updatedAt");

  // 👉 If nothing to update, just return existing ebook
  if (!sets.length) return await getById(ebookid);

  const params = {
    TableName: TABLE,
    Key: { ebookid },
    UpdateExpression: "SET " + sets.join(", "),
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ReturnValues: "ALL_NEW", // return updated version
  };

  const out = await ddb.update(params).promise();
  return out.Attributes; // updated ebook object
}

// 👉 Export all functions
module.exports = {
  createEBook,
  getById,
  getByInstituteAndSlug,
  listByInstitute,
  updateEBook,
};
