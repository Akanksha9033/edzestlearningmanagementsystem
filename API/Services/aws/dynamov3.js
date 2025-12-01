const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-south-1",
});

const ddb = DynamoDBDocumentClient.from(client);

module.exports = {
  ddb,
  GetCommand,
  PutCommand,
  QueryCommand,
};
