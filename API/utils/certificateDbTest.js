const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
} = require("@aws-sdk/lib-dynamodb");

/* ================= CONFIG ================= */
const REGION = process.env.AWS_REGION || "ap-south-1";
const TABLE = process.env.CERTIFICATES_TABLE || "Certificates";

const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: REGION })
);

async function saveCertificate() {
  const item = {
   pk: "USER#<PASTE_REAL_SUB_HERE>",

    sk: "CERT#COURSE#test-course",
    courseId: "test-course",
    courseTitle: "Test Course",
    certificateId: "CERT-TEST-001",
    s3Key: "certificates/test-user/test-course.pdf",
    issuedAt: new Date().toISOString(),
  };

  await ddb.send(
    new PutCommand({
      TableName: TABLE,
      Item: item,
    })
  );

  console.log("✅ Certificate record saved to DynamoDB");
}

saveCertificate().catch(console.error);
