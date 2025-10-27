const { ddb, USERS_TABLE, scanTable, putItem, getItem, deleteItem } = require("./aws/dynamo");
const { DEF_INST_ID, DEF_INST_NAME, DEF_ADMIN_ID } = require("./constants");

async function ensureProfile({ sub, email, name, role, emailVerified }) {
  const now = new Date().toISOString();

  // 1) try the correct (uuid) key
  let { Item } = await ddb.get({ TableName: USERS_TABLE, Key: { sub } }).promise();

  if (!Item) {
    // 2) migrate/merge from legacy item keyed by email-as-sub
    const scan = await ddb.scan({
      TableName: USERS_TABLE,
      FilterExpression: "#e = :e",
      ExpressionAttributeNames: { "#e": "email" },
      ExpressionAttributeValues: { ":e": String(email).toLowerCase() }
    }).promise();

    const legacy = (scan.Items || [])[0];

    Item = {
      sub,
      email: String(email).toLowerCase(),
      name,
      // prefer institute/role from legacy if present
      role: (legacy && legacy.role) ? legacy.role : role,
      // ⬇️ default institute for students when missing
      instituteId: (legacy?.instituteId) || (role === "Student" ? DEF_INST_ID : null),
      instituteName: (legacy?.instituteName) || (role === "Student" ? DEF_INST_NAME : ""),
      ...(DEF_ADMIN_ID && role === "Student" ? { createdBy: legacy?.createdBy || DEF_ADMIN_ID } : {}),
      emailVerified,
      createdAt: legacy?.createdAt || now,
      updatedAt: now
    };

    await ddb.put({ TableName: USERS_TABLE, Item }).promise();

    // optional tidy-up: remove the legacy row to avoid duplicates
    if (legacy?.sub && legacy.sub !== sub) {
      try {
        await ddb.delete({ TableName: USERS_TABLE, Key: { sub: legacy.sub } }).promise();
      } catch {}
    }
    return Item;
  }

  // keep role / verification in sync
  let dirty = false;
  if (Item.role !== role) { Item.role = role; dirty = true; }
  if (Item.emailVerified !== emailVerified) { Item.emailVerified = emailVerified; dirty = true; }

  // ⬇️ backfill defaults if this is a Student with missing institute
  if ((Item.role || role) === "Student" && (!Item.instituteId || !Item.instituteName)) {
    Item.instituteId = DEF_INST_ID;
    Item.instituteName = DEF_INST_NAME;
    if (!Item.createdBy && DEF_ADMIN_ID) Item.createdBy = DEF_ADMIN_ID;
    dirty = true;
  }

  if (dirty) {
    Item.updatedAt = now;
    await ddb.put({ TableName: USERS_TABLE, Item }).promise();
  }
  return Item;
}

module.exports = { ensureProfile };
