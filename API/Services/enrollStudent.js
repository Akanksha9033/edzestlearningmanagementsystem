// const { PutCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");

// async function enrollStudent({
//   ddb,
//   tableName,
//   studentSub,
//   productId,
//   productType,
//   title = null,
//   thumbnailUrl = null,
//   accessSource,          // free | paid | admin
//   expiry = null,
//   assignedBy = null,
// }) {
//   const sk = `ENROLLMENT#${productType}#${productId}`;

//   // 🔒 Prevent duplicate enrollment
//   const existing = await ddb.send(
//     new QueryCommand({
//       TableName: tableName,
//       KeyConditionExpression: "pk = :pk AND sk = :sk",
//       ExpressionAttributeValues: {
//         ":pk": `USER#${studentSub}`,
//         ":sk": sk,
//       },
//     })
//   );

//   if (existing.Items && existing.Items.length > 0) {
//     return { alreadyEnrolled: true };
//   }

//   await ddb.send(
//     new PutCommand({
//       TableName: tableName,
//       Item: {
//         pk: `USER#${studentSub}`,
//         sk,

//         productId,
//         productType,
//         title: title || productType,
//         thumbnailUrl: thumbnailUrl || null,

//         accessSource,                 // 🔑
//         status: "ACTIVE",
//         expiry,                       // 🔑
//         assignedBy,                   // 🔑 (admin only)

//         createdAt: new Date().toISOString(),
//       },
//     })
//   );

//   return { success: true };
// }

// module.exports = { enrollStudent };
const { PutCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");

async function enrollStudent({
  ddb,
  tableName,
  studentSub,
  productId,
  productType,
  title = null,
  thumbnailUrl = null,
  accessSource,          // free | paid | admin
  expiry = null,
  assignedBy = null,
}) {
  const sk = `ENROLLMENT#${productType}#${productId}`;

  console.log("🧾 [ENROLL] Incoming payload:", {
    studentSub,
    productId,
    productType,
    title,
    thumbnailUrl,
    accessSource,
  });

  // 🔒 Prevent duplicate enrollment
  const existing = await ddb.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "pk = :pk AND sk = :sk",
      ExpressionAttributeValues: {
        ":pk": `USER#${studentSub}`,
        ":sk": sk,
      },
    })
  );

  if (existing.Items && existing.Items.length > 0) {
    console.log("⚠️ [ENROLL] Already enrolled");
    return { alreadyEnrolled: true };
  }

  const item = {
    pk: `USER#${studentSub}`,
    sk,

    productId,
    productType,
    title: title || productType,
    thumbnailUrl: thumbnailUrl || null,

    accessSource,
    status: "ACTIVE",
    expiry,
    assignedBy,

    createdAt: new Date().toISOString(),
  };

  console.log("📦 [ENROLL] Saving item:", item);

  await ddb.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
    })
  );

  return { success: true };
}

module.exports = { enrollStudent };
