// const AWS = require("./config");
// const { USERS_TABLE } = require("../constants");

// const ddb = new AWS.DynamoDB.DocumentClient();

// // Generic helpers (if you want them)
// const getItem = (TableName, Key) => ddb.get({ TableName, Key }).promise();
// const putItem = (TableName, Item) => ddb.put({ TableName, Item }).promise();
// const deleteItem = (TableName, Key) => ddb.delete({ TableName, Key }).promise();
// const scanTable = (params) => ddb.scan(params).promise();

// // App-specific bits you already use in middleware
// async function getUser(sub) {
//   const r = await ddb.get({ TableName: USERS_TABLE, Key: { sub } }).promise();
//   return r.Item || null;
// }
// async function putUser(item) {
//   await ddb.put({ TableName: USERS_TABLE, Item: item }).promise();
// }

// module.exports = {
//   ddb,
//   USERS_TABLE,
//   getUser,
//   putUser,
//   getItem,
//   putItem,
//   deleteItem,
//   scanTable,
// };


// dynamo v3 version 


// =======================
//  SDK v3 Dynamo Wrapper
// =======================

const {
  DynamoDBClient
} = require("@aws-sdk/client-dynamodb");

const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand,
  UpdateCommand,
  BatchWriteCommand,
  BatchGetCommand        // ⭐ ADDED
} = require("@aws-sdk/lib-dynamodb");

const { USERS_TABLE } = require("../constants");

const REGION = process.env.AWS_REGION || "ap-south-1";

/* ------------------ CLIENT ------------------ */
const client = new DynamoDBClient({ region: REGION });
const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});


/* ------- v2-style wrapper (NO breaking changes) ------- */
const dynamo = {
  get: (params) => ({
    promise: () => ddb.send(new GetCommand(params)),
  }),

  put: (params) => ({
    promise: () => ddb.send(new PutCommand(params)),
  }),

  delete: (params) => ({
    promise: () => ddb.send(new DeleteCommand(params)),
  }),

  scan: (params) => ({
    promise: () => ddb.send(new ScanCommand(params)),
  }),

  query: (params) => ({
    promise: () => ddb.send(new QueryCommand(params)),
  }),

  update: (params) => ({
    promise: () => ddb.send(new UpdateCommand(params)),
  }),

  batchWrite: (params) => ({
    promise: () => ddb.send(new BatchWriteCommand(params)),
  }),

  // ⭐ REQUIRED FOR QBANK SUBMIT + FILTERS
  batchGet: (params) => ({
    promise: () => ddb.send(new BatchGetCommand(params)),
  }),
};

/* ----------- Custom helpers (unchanged) ------------- */
async function getUser(sub) {
  const resp = await dynamo
    .get({
      TableName: USERS_TABLE,
      Key: { sub },
    })
    .promise();
  return resp.Item || null;
}

async function putUser(item) {
  await dynamo
    .put({
      TableName: USERS_TABLE,
      Item: item,
    })
    .promise();
}

module.exports = {
  ddb: dynamo,
  USERS_TABLE,
  getUser,
  putUser,
};
