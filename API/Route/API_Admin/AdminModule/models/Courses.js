const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");

/* ✅ Always provide credentials explicitly */
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const ddb = DynamoDBDocumentClient.from(client);

const TABLE = process.env.DDB_TABLE || "edzest_lms";

/* ---------------------------
   Helpers
--------------------------- */
function docifyCourse(item) {
  if (!item) return null;
  item.sections = Array.isArray(item.sections) ? item.sections : [];

  item.save = async function () {
    const putItem = {
      pk: `COURSE#${this._id}`,
      sk: "COURSE",
      entity: "course",
      ...this,
    };
    await ddb.send(new PutCommand({ TableName: TABLE, Item: putItem }));
    return this;
  };

  item.lean = () => JSON.parse(JSON.stringify(item));
  return item;
}

/* ---------------------------
   Course Class
--------------------------- */
class Courses {
  constructor(obj = {}) {
    Object.assign(this, obj);
    if (!this._id) this._id = uuidv4();
    if (!this.sections) this.sections = [];
    if (!this.createdAt) this.createdAt = new Date().toISOString();
    if (!this.lastUpdatedAt) this.lastUpdatedAt = new Date().toISOString();
  }

  async save() {
    this.lastUpdatedAt = new Date().toISOString();
    const item = {
      pk: `COURSE#${this._id}`,
      sk: "COURSE",
      entity: "course",
      ...this,
    };
    await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
    return this;
  }

  static async findById(id) {
    const out = await ddb.send(
      new GetCommand({
        TableName: TABLE,
        Key: { pk: `COURSE#${id}`, sk: "COURSE" },
      })
    );
    return docifyCourse(out.Item || null);
  }

  static async findOne(query = {}) {
    if (query.slug) {
      const out = await ddb.send(
        new QueryCommand({
          TableName: TABLE,
          IndexName: "GSI1-Slug", // must exist in Dynamo
          KeyConditionExpression: "#slug = :slug AND #sk = :sk",
          ExpressionAttributeNames: { "#slug": "slug", "#sk": "sk" },
          ExpressionAttributeValues: { ":slug": query.slug, ":sk": "COURSE" },
          Limit: 1,
        })
      );
      return out.Items?.length ? docifyCourse(out.Items[0]) : null;
    }
    return null;
  }

  static async find(query = {}) {
  // base filter: only course entities
  let FilterExpression = "#e = :e";
  const ExpressionAttributeNames = { "#e": "entity" };
  const ExpressionAttributeValues = { ":e": "course" };

  // add status filter only if provided (e.g. for Student view)
  if (query.status) {
    FilterExpression += " AND #st = :st";
    ExpressionAttributeNames["#st"] = "status";
    ExpressionAttributeValues[":st"] = String(query.status);
  }

  // (optional) keep other filters the same way
  if (query.instituteId) {
    FilterExpression += " AND #inst = :inst";
    ExpressionAttributeNames["#inst"] = "instituteId";
    ExpressionAttributeValues[":inst"] = String(query.instituteId);
  }

  const out = await ddb.send(
    new ScanCommand({
      TableName: TABLE,
      FilterExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
    })
  );

  const items = out.Items || [];
  // keep your Mongoose-like helper for callers that expect it
  items.lean = () => items;
  return items;
}

  static async findByIdAndUpdate(id, update = {}) {
    const toSet = update.$set || update;
    if (!toSet || Object.keys(toSet).length === 0) {
      return await this.findById(id);
    }

    const names = {};
    const values = {};
    const sets = [];
    let i = 0;
    for (const [k, v] of Object.entries(toSet)) {
      names[`#k${i}`] = k;
      values[`:v${i}`] = v;
      sets.push(`#k${i} = :v${i}`);
      i++;
    }

    const out = await ddb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { pk: `COURSE#${id}`, sk: "COURSE" },
        UpdateExpression: "SET " + sets.join(", "),
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: "ALL_NEW",
      })
    );
    return docifyCourse(out.Attributes || null);
  }

  static async findByIdAndDelete(id) {
    const out = await ddb.send(
      new DeleteCommand({
        TableName: TABLE,
        Key: { pk: `COURSE#${id}`, sk: "COURSE" },
        ReturnValues: "ALL_OLD",
      })
    );
    return out.Attributes ? docifyCourse(out.Attributes) : null;
  }
}

module.exports = Courses;
