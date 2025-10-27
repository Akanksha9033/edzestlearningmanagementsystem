// const AWS = require("aws-sdk");

// AWS.config.update({
//   region: process.env.AWS_REGION || "ap-south-1",
// });

// const ddb = new AWS.DynamoDB.DocumentClient();

// module.exports = { ddb };



// backend/dynamo/ebooksRepo.js

const { ddb } = require("./client"); // ✅ Use shared DynamoDB DocumentClient

// Table name — from env, fallback to actual table name
const TABLE = process.env.DDB_EBOOKS || "e-book";

// GSIs (already created in your table)
const GSI_DATE = "byInstituteDate"; // (instituteId, createdAt)
const GSI_SLUG = "byInstituteSlug"; // (instituteId, slug)

/**
 * Create a new e-book
 * @param {Object} item - EBook item with ebookid, instituteId, slug, etc.
 */
async function createEBook(item) {
  const params = {
    TableName: TABLE,
    Item: item,
    ConditionExpression: "attribute_not_exists(ebookid)",
  };
  await ddb.put(params).promise();
  return item;
}

/**
 * Get e-book by ID (Primary Key)
 */
async function getById(ebookid) {
  const out = await ddb
    .get({
      TableName: TABLE,
      Key: { ebookid },
    })
    .promise();
  return out.Item || null;
}

/**
 * Get e-book by Institute + Slug (GSI)
 */
async function getByInstituteAndSlug(instituteId, slug) {
  const out = await ddb
    .query({
      TableName: TABLE,
      IndexName: GSI_SLUG,
      KeyConditionExpression: "instituteId = :i AND #slug = :s",
      ExpressionAttributeValues: {
        ":i": instituteId,
        ":s": slug,
      },
      ExpressionAttributeNames: {
        "#slug": "slug",
      },
      Limit: 1,
    })
    .promise();

  return out.Items?.[0] || null;
}

/**
 * List all e-books for one institute (using GSI byInstituteDate)
 * Supports filtering by status and pagination cursor
 */
async function listByInstitute(instituteId, opts = {}) {
  const { status, limit = 20, cursor, descending = true } = opts;

  const params = {
    TableName: TABLE,
    IndexName: GSI_DATE,
    KeyConditionExpression: "instituteId = :i",
    ExpressionAttributeValues: { ":i": instituteId },
    ScanIndexForward: !descending, // false → newest first
    Limit: limit,
  };

  if (cursor) params.ExclusiveStartKey = cursor;

  if (status) {
    params.FilterExpression = "#status = :s";
    params.ExpressionAttributeNames = {
      ...(params.ExpressionAttributeNames || {}),
      "#status": "status",
    };
    params.ExpressionAttributeValues[":s"] = status;
  }

  const out = await ddb.query(params).promise();
  return { items: out.Items || [], cursor: out.LastEvaluatedKey || null };
}

/**
 * Update e-book (dynamic field patch)
 */
async function updateEBook(ebookid, patch = {}) {
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

  const names = {};
  const values = {};
  const sets = [];

  // add all provided fields dynamically
  fields.forEach((k) => {
    if (patch[k] !== undefined) {
      names["#" + k] = k;
      values[":" + k] = patch[k];
      sets.push(`#${k} = :${k}`);
    }
  });

  // always update updatedAt
  names["#updatedAt"] = "updatedAt";
  values[":updatedAt"] = new Date().toISOString();
  sets.push("#updatedAt = :updatedAt");

  if (!sets.length) return await getById(ebookid);

  const params = {
    TableName: TABLE,
    Key: { ebookid },
    UpdateExpression: "SET " + sets.join(", "),
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ReturnValues: "ALL_NEW",
  };

  const out = await ddb.update(params).promise();
  return out.Attributes;
}

module.exports = {
  createEBook,
  getById,
  getByInstituteAndSlug,
  listByInstitute,
  updateEBook,
};
