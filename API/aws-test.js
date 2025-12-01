const {
  DynamoDBClient
} = require("@aws-sdk/client-dynamodb");

const {
  DynamoDBDocumentClient,
  ScanCommand
} = require("@aws-sdk/lib-dynamodb");

(async () => {
  try {
    const client = new DynamoDBClient({ region: "ap-south-1" });
    const doc = DynamoDBDocumentClient.from(client);

    const data = await doc.send(
      new ScanCommand({
        TableName: "edzest_lms",
        Limit: 1
      })
    );

    console.log("SUCCESS:", data);
  } catch (err) {
    console.log("ERROR:", err.name, err.message);
  }
})();
