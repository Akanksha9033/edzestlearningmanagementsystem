const AWS = require("./config");
const { USERS_TABLE } = require("../constants");

const ddb = new AWS.DynamoDB.DocumentClient();

// Generic helpers (if you want them)
const getItem = (TableName, Key) => ddb.get({ TableName, Key }).promise();
const putItem = (TableName, Item) => ddb.put({ TableName, Item }).promise();
const deleteItem = (TableName, Key) => ddb.delete({ TableName, Key }).promise();
const scanTable = (params) => ddb.scan(params).promise();

// App-specific bits you already use in middleware
async function getUser(sub) {
  const r = await ddb.get({ TableName: USERS_TABLE, Key: { sub } }).promise();
  return r.Item || null;
}
async function putUser(item) {
  await ddb.put({ TableName: USERS_TABLE, Item: item }).promise();
}

module.exports = {
  ddb,
  USERS_TABLE,
  getUser,
  putUser,
  getItem,
  putItem,
  deleteItem,
  scanTable,
};
