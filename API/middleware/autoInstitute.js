// middleware/autoInstitute.js
const AWS = require("aws-sdk");
const ddb = new AWS.DynamoDB.DocumentClient();

const USERS_TABLE = process.env.DDB_USERS_TABLE || "EdzestUsers";  // <-- FIX

const DEF_INST_ID   = process.env.DEFAULT_INSTITUTE_ID   || "0z2w1ep";
const DEF_INST_NAME = process.env.DEFAULT_INSTITUTE_NAME || "Edzest";
const DEF_ADMIN_ID  = process.env.DEFAULT_ADMIN_ID || null;

function needsInstitute(user) {
  const idMissing   = !user?.instituteId || String(user.instituteId).trim() === "";
  const nameMissing = !user?.instituteName || String(user.instituteName).trim() === "";
  return idMissing || nameMissing;
}

async function backfillUserInstitute(user) {
  const sub = user?.id || user?._id;             // your request-scoped id
  if (!sub) return;

  const names = { "#i": "instituteId", "#n": "instituteName" };
  const vals  = { ":iid": DEF_INST_ID, ":nm": DEF_INST_NAME };
  let setExp  = "SET #i = :iid, #n = :nm";

  if (DEF_ADMIN_ID && !user.createdBy) {
    names["#c"] = "createdBy";
    vals[":cb"] = DEF_ADMIN_ID;
    setExp += ", #c = :cb";
  }

  try {
    await ddb.update({
      TableName: USERS_TABLE,
      Key: { sub },                                // <-- FIX: PK is sub
      UpdateExpression: setExp,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: vals,
      ConditionExpression: "attribute_exists(sub)",// only if user already exists
    }).promise();
  } catch (e) {
    // ignore ConditionalCheckFailedException; best-effort backfill
  }
}

function enrichRequestUser(req) {
  const role = (req.user?.role || "").toLowerCase();
  if (role !== "student") return;

  if (needsInstitute(req.user)) {
    req.user.instituteId   = DEF_INST_ID;         // visible immediately in this request
    req.user.instituteName = DEF_INST_NAME;
    if (!req.user.createdBy && DEF_ADMIN_ID) req.user.createdBy = DEF_ADMIN_ID;
    // persist in background (no await; no flow change)
    backfillUserInstitute(req.user);
  }
}

module.exports = { enrichRequestUser };
