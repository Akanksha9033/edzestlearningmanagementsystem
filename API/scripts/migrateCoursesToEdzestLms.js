// API/scripts/migrateCoursesToEdzestLms.js
require("dotenv").config();
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-south-1",
});
const ddb = DynamoDBDocumentClient.from(client);

const TABLE = "edzest_lms";

async function migrateCourses() {
  console.log("🚀 Starting course migration...");

  // 1️⃣ Scan all COURSE items (MASTER + lesson mixed honge)
  const scanRes = await ddb.send(
    new ScanCommand({
      TableName: TABLE,
      FilterExpression: "begins_with(pk, :pk)",
      ExpressionAttributeValues: {
        ":pk": "COURSE#",
      },
    })
  );

  const items = scanRes.Items || [];

  console.log(`📦 Found ${items.length} raw COURSE items`);

  // 2️⃣ Only MASTER courses nikaalo (jinke paas title hai)
  const courseMasters = items.filter(
    (i) => i.title && !i.sk?.startsWith("LESSON#")
  );

  console.log(`🎓 Found ${courseMasters.length} course masters`);

  // 3️⃣ META row create karo
  for (const c of courseMasters) {
    console.log("➡️ Migrating:", c.title);

    await ddb.send(
      new PutCommand({
        TableName: TABLE,
        Item: {
          pk: c.pk,
          sk: "META",
          type: "COURSE",
          title: c.title,
          status:
            String(c.status || "").toLowerCase() === "published"
              ? "PUBLISHED"
              : "DRAFT",
          price: c.price || 0,
          isFree: c.isFree || false,
          instituteId: c.instituteId || null,
          createdAt: c.createdAt || new Date().toISOString(),
        },
      })
    );
  }

  console.log("✅ Course migration completed");
}

migrateCourses().catch((err) => {
  console.error("❌ Migration failed:", err);
});
