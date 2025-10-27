const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.AWS_REGION || "ap-south-1" });

const ddb = new AWS.DynamoDB.DocumentClient();

const TABLE = process.env.DDB_EBOOKS || "e-book"; // ✅ matches your actual table name
const GSI_DATE = "byInstituteDate";
const GSI_SLUG = "byInstituteSlug";

/**
//  * ✅ Create a new e-book record
 */
async function createEBook(item) {
  if (!item.ebookid) item.ebookid = uuidv4();
  const params = {
    TableName: TABLE,
    Item: item,
    ConditionExpression: "attribute_not_exists(ebookid)",
  };
  await ddb.put(params).promise();
  return item;
}

/**
 * ✅ Get e-book by ID
 */
async function getById(ebookid) {
  const out = await ddb.get({
    TableName: TABLE,
    Key: { ebookid },
  }).promise();
  return out.Item || null;
}

/**
 * ✅ Get e-book by institute + slug (via GSI)
 */
async function getByInstituteAndSlug(instituteId, slug) {
  const params = {
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
  };
  const out = await ddb.query(params).promise();
  return out.Items?.[0] || null;
}

/**
 * ✅ List all e-books for an institute (via GSI byInstituteDate)
 */
async function listByInstitute(instituteId, opts = {}) {
  const { status, limit = 20, cursor, descending = true } = opts;
  const params = {
    TableName: TABLE,
    IndexName: GSI_DATE,
    KeyConditionExpression: "instituteId = :i",
    ExpressionAttributeValues: { ":i": instituteId },
    ScanIndexForward: !descending, // false => newest first
    Limit: limit,
  };

  if (cursor) params.ExclusiveStartKey = cursor;
  if (status) {
    params.FilterExpression = "#status = :s";
    params.ExpressionAttributeNames = { "#status": "status" };
    params.ExpressionAttributeValues[":s"] = status;
  }

  const out = await ddb.query(params).promise();
  return { items: out.Items || [], cursor: out.LastEvaluatedKey || null };
}

/**
 * ✅ Update an e-book dynamically (only provided fields)
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

  for (const key of fields) {
    if (patch[key] !== undefined) {
      names[`#${key}`] = key;
      values[`:${key}`] = patch[key];
      sets.push(`#${key} = :${key}`);
    }
  }

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
