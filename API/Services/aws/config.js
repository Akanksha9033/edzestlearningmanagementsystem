// ======================================================================
//  AWS SDK v3 DROP-IN CONFIG (v2-compatible exports)
//  This allows old code like `new AWS.DynamoDB.DocumentClient()` to work.
// ======================================================================

const {
  DynamoDBClient,
  DynamoDB
} = require("@aws-sdk/client-dynamodb");

const {
  DynamoDBDocumentClient
} = require("@aws-sdk/lib-dynamodb");

const {
  S3Client
} = require("@aws-sdk/client-s3");

const { REGION } = require("../constants");

// -------------------- S3 (v3) --------------------
const s3 = new S3Client({ region: REGION });

// -------------------- DynamoDB (v3) --------------------
const ddbClient = new DynamoDBClient({ region: REGION });

// DocumentClient equivalent (replacement for AWS.DynamoDB.DocumentClient)
const DocumentClient = DynamoDBDocumentClient.from(ddbClient);

// -------------------- Export v2-like object --------------------
module.exports = {
  // v2-style namespaces so old code doesn't break
  DynamoDB: {
    DocumentClient: function () {
      return DocumentClient;
    },
  },

  S3: function () {
    return s3;
  },

  // direct clients (optional)
  s3,
  ddbClient,
};
