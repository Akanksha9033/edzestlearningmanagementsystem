// Central place for env-driven constants so everyone reads the same values.
const REGION = process.env.COGNITO_REGION || process.env.AWS_REGION || "ap-south-1";

module.exports = {
  REGION,
  USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
  APP_CLIENT_ID: process.env.COGNITO_APP_CLIENT_ID,
  USERS_TABLE: process.env.DDB_USERS_TABLE || "EdzestUsers",

  // Defaults used in ensureProfile
  DEF_INST_ID:   process.env.DEFAULT_INSTITUTE_ID   || "0z2w1ep",
  DEF_INST_NAME: process.env.DEFAULT_INSTITUTE_NAME || "Edzest",
  DEF_ADMIN_ID:  process.env.DEFAULT_ADMIN_ID       || null,
};
