// const { ddb, USERS_TABLE, scanTable, putItem, getItem, deleteItem } = require("./aws/dynamo");
// const { DEF_INST_ID, DEF_INST_NAME, DEF_ADMIN_ID } = require("./constants");

// async function ensureProfile({ sub, email, name, role, emailVerified }) {
//   const now = new Date().toISOString();

//   // 1) try the correct (uuid) key
//   let { Item } = await ddb.get({ TableName: USERS_TABLE, Key: { sub } }).promise();

//   if (!Item) {
//     // 2) migrate/merge from legacy item keyed by email-as-sub
//     const scan = await ddb.scan({
//       TableName: USERS_TABLE,
//       FilterExpression: "#e = :e",
//       ExpressionAttributeNames: { "#e": "email" },
//       ExpressionAttributeValues: { ":e": String(email).toLowerCase() }
//     }).promise();

//     const legacy = (scan.Items || [])[0];

//     Item = {
//       sub,
//       email: String(email).toLowerCase(),
//       name,
//       // prefer institute/role from legacy if present
//       role: (legacy && legacy.role) ? legacy.role : role,
//       // ⬇️ default institute for students when missing
//       instituteId: (legacy?.instituteId) || (role === "Student" ? DEF_INST_ID : null),
//       instituteName: (legacy?.instituteName) || (role === "Student" ? DEF_INST_NAME : ""),
//       ...(DEF_ADMIN_ID && role === "Student" ? { createdBy: legacy?.createdBy || DEF_ADMIN_ID } : {}),
//       emailVerified,
//       createdAt: legacy?.createdAt || now,
//       updatedAt: now
//     };

//     await ddb.put({ TableName: USERS_TABLE, Item }).promise();

//     // optional tidy-up: remove the legacy row to avoid duplicates
//     if (legacy?.sub && legacy.sub !== sub) {
//       try {
//         await ddb.delete({ TableName: USERS_TABLE, Key: { sub: legacy.sub } }).promise();
//       } catch {}
//     }
//     return Item;
//   }

//   // keep role / verification in sync
//   let dirty = false;
//   if (Item.role !== role) { Item.role = role; dirty = true; }
//   if (Item.emailVerified !== emailVerified) { Item.emailVerified = emailVerified; dirty = true; }

//   // ⬇️ backfill defaults if this is a Student with missing institute
//   if ((Item.role || role) === "Student" && (!Item.instituteId || !Item.instituteName)) {
//     Item.instituteId = DEF_INST_ID;
//     Item.instituteName = DEF_INST_NAME;
//     if (!Item.createdBy && DEF_ADMIN_ID) Item.createdBy = DEF_ADMIN_ID;
//     dirty = true;
//   }

//   if (dirty) {
//     Item.updatedAt = now;
//     await ddb.put({ TableName: USERS_TABLE, Item }).promise();
//   }
//   return Item;
// }

// module.exports = { ensureProfile };


// sdk v3 version

// Services/userProfile.js  (AWS SDK v3 MIGRATED)

const {
  DynamoDBClient
} = require("@aws-sdk/client-dynamodb");

const {
  DynamoDBDocumentClient,
  GetCommand,
  ScanCommand,
  PutCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");

const {
  DEF_INST_ID,
  DEF_INST_NAME,
  DEF_ADMIN_ID
} = require("./constants");

// Environment
const REGION =
  process.env.COGNITO_REGION ||
  process.env.AWS_REGION ||
  "ap-south-1";

const USERS_TABLE = process.env.DDB_USERS_TABLE || "EdzestUsers";

// DynamoDB v3 Client
const ddbClient = new DynamoDBClient({ region: REGION });
const ddb = DynamoDBDocumentClient.from(ddbClient);

/**
 * ensureProfile
 * - fetches user by new PK: sub
 * - if not exists → migrate from legacy email-based rows
 * - updates role/emailVerified if changed
 * - auto-fill institute for Students
 */
async function ensureProfile({ sub, email, name, role, emailVerified }) {
  const now = new Date().toISOString();
  const emailLower = String(email).toLowerCase();

  // 1) Try correct new primary key: sub
  let r = await ddb.send(
    new GetCommand({
      TableName: USERS_TABLE,
      Key: { sub },
    })
  );

  let Item = r.Item;

  if (!Item) {
    // 2) Migrate from legacy row (email-as-sub)
    const scan = await ddb.send(
      new ScanCommand({
        TableName: USERS_TABLE,
        FilterExpression: "#e = :e",
        ExpressionAttributeNames: { "#e": "email" },
        ExpressionAttributeValues: { ":e": emailLower },
      })
    );

    const legacy = (scan.Items || [])[0];

    // Build merged profile
    Item = {
      sub,
      email: emailLower,
      name,

      // Prefer legacy role if exists
      role: legacy?.role || role,

      // fill institute if Student
      instituteId:
        legacy?.instituteId || (role === "Student" ? DEF_INST_ID : null),

      instituteName:
        legacy?.instituteName || (role === "Student" ? DEF_INST_NAME : ""),

      ...(DEF_ADMIN_ID && role === "Student"
        ? { createdBy: legacy?.createdBy || DEF_ADMIN_ID }
        : {}),

      emailVerified,
      createdAt: legacy?.createdAt || now,
      updatedAt: now,
    };

    // Save new profile (v3)
    await ddb.send(
      new PutCommand({
        TableName: USERS_TABLE,
        Item,
      })
    );

    // Optional: remove legacy row
    if (legacy?.sub && legacy.sub !== sub) {
      try {
        await ddb.send(
          new DeleteCommand({
            TableName: USERS_TABLE,
            Key: { sub: legacy.sub },
          })
        );
      } catch {}
    }

    return Item;
  }

  // Already exists → sync role + emailVerified
  let dirty = false;

  if (Item.role !== role) {
    Item.role = role;
    dirty = true;
  }

  if (Item.emailVerified !== emailVerified) {
    Item.emailVerified = emailVerified;
    dirty = true;
  }

  // Auto backfill Student institute
  if (
    (Item.role || role) === "Student" &&
    (!Item.instituteId || !Item.instituteName)
  ) {
    Item.instituteId = DEF_INST_ID;
    Item.instituteName = DEF_INST_NAME;

    if (!Item.createdBy && DEF_ADMIN_ID) {
      Item.createdBy = DEF_ADMIN_ID;
    }
    dirty = true;
  }

  // Update profile if any changes
  if (dirty) {
    Item.updatedAt = now;

    await ddb.send(
      new PutCommand({
        TableName: USERS_TABLE,
        Item,
      })
    );
  }

  return Item;
}

module.exports = { ensureProfile };
