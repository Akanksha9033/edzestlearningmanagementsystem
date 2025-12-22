const { v4: uuidv4 } = require("uuid");

/* ---------------- AWS SDK v3 ---------------- */
// Import DynamoDB client (low-level)
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

// Import DocumentClient commands (Put, Get, Query, Update)
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");

// Determine region (prefer env, fallback to ap-south-1)
const region = process.env.AWS_REGION || "ap-south-1";

// Create high-level DynamoDB Document client
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

// DynamoDB table name (fallback default = "e-book")
const TABLE = process.env.DDB_EBOOKS || "e-book";

// GSI names already created in DynamoDB
const GSI_DATE = "byInstituteDate"; // (instituteId, createdAt)
const GSI_SLUG = "byInstituteSlug"; // (instituteId, slug)


/* ======================================================
   CREATE EBOOK  (same logic)
   Inserts a new ebook item into DynamoDB.
   Uses ConditionExpression to prevent duplicate ebookid.
====================================================== */
async function createEBook(item) {
  // Auto-add UUID if not provided
  if (!item.ebookid) item.ebookid = uuidv4();

  await ddb.send(
    new PutCommand({
      TableName: TABLE,
      Item: item,
      ConditionExpression: "attribute_not_exists(ebookid)", // ensure no duplicate
    })
  );

  return item;
}


/* ======================================================
   GET BY ID  (same logic)
   Fetches a single e-book via primary key (ebookid)
====================================================== */
async function getById(ebookid) {
  const out = await ddb.send(
    new GetCommand({
      TableName: TABLE,
      Key: { ebookid },
    })
  );

  return out.Item || null; // return null instead of undefined
}


/* ======================================================
   GET BY INSTITUTE + SLUG (via GSI)
   Used for URL pages like /ebook/:slug inside an institute
====================================================== */
async function getByInstituteAndSlug(instituteId, slug) {
  const out = await ddb.send(
    new QueryCommand({
      TableName: TABLE,
     IndexName: GSI_SLUG, // must match GSI name
      KeyConditionExpression: "instituteId = :i AND #slug = :s",
      ExpressionAttributeValues: {
        ":i": instituteId,
        ":s": slug,
      },
      ExpressionAttributeNames: {
        "#slug": "slug", // reserved word protection
      },
      Limit: 1, // we only expect 1
    })
  );

  return out.Items?.[0] || null;
}


/* ======================================================
   LIST BY INSTITUTE (via GSI)
   Returns paginated list of ebooks of one institute.
   Supports: status filter, pagination cursor, newest first.
====================================================== */
async function listByInstitute(instituteId, opts = {}) {
  const { status, limit = 20, cursor, descending = true } = opts;

  const params = {
    TableName: TABLE,
    IndexName: GSI_DATE, // ordered by createdAt
    KeyConditionExpression: "instituteId = :i",
    ExpressionAttributeValues: { ":i": instituteId },
    ScanIndexForward: !descending, // false = newest first
    Limit: limit,
  };

  // pagination support
  if (cursor) params.ExclusiveStartKey = cursor;

  // optional filtering by status
  if (status) {
    params.FilterExpression = "#status = :s";
    params.ExpressionAttributeNames = { "#status": "status" };
    params.ExpressionAttributeValues[":s"] = status;
  }

  const out = await ddb.send(new QueryCommand(params));

  return { items: out.Items || [], cursor: out.LastEvaluatedKey || null };
}


/* ======================================================
   UPDATE EBOOK (same logic)
   Dynamically updates any allowed fields.
   Always updates updatedAt.
====================================================== */
async function updateEBook(ebookid, patch = {}) {
  // Only allow these fields to be updated
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

  const names = {};   // ExpressionAttributeNames
  const values = {};  // ExpressionAttributeValues
  const sets = [];    // list of `#field = :value`

  // Only include fields present in patch
  for (const key of fields) {
    if (patch[key] !== undefined) {
      names[`#${key}`] = key;
      values[`:${key}`] = patch[key];
      sets.push(`#${key} = :${key}`);
    }
  }

  // Always update timestamp
  names["#updatedAt"] = "updatedAt";
  values[":updatedAt"] = new Date().toISOString();
  sets.push("#updatedAt = :updatedAt");

  // If no fields provided → return original item
  if (!sets.length) return await getById(ebookid);

  // Perform DynamoDB UPDATE
  const out = await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { ebookid },
      UpdateExpression: "SET " + sets.join(", "),
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW", // return updated document
    })
  );

  return out.Attributes;
}


// Export all repo functions
module.exports = {
  createEBook,
  getById,
  getByInstituteAndSlug,
  listByInstitute,
  updateEBook,
};
