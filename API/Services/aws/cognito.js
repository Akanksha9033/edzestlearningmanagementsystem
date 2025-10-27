const AWS = require("./config");
const { USER_POOL_ID, APP_CLIENT_ID, REGION } = require("../constants");

const cognito = new AWS.CognitoIdentityServiceProvider({ region: REGION });

// Expose the raw client and common call sites you already use
module.exports = {
  cognito,
  USER_POOL_ID,
  APP_CLIENT_ID,
};
