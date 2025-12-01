// const AWS = require("./config");
// const { USER_POOL_ID, APP_CLIENT_ID, REGION } = require("../constants");

// const cognito = new AWS.CognitoIdentityServiceProvider({ region: REGION });

// // Expose the raw client and common call sites you already use
// module.exports = {
//   cognito,
//   USER_POOL_ID,
//   APP_CLIENT_ID,
// };


// sdk v3 version

// ==============================================
//   SDK v3 Cognito Wrapper (v2-compatible API)
// ==============================================

// ==============================================
//   AWS SDK v3 - PURE COGNITO CLIENT
// ==============================================

const {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  GetUserCommand,
  AdminListGroupsForUserCommand,
  GlobalSignOutCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  ChangePasswordCommand,
  ResendConfirmationCodeCommand,
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
  AdminSetUserPasswordCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const { REGION, USER_POOL_ID, APP_CLIENT_ID } = require("../constants");

// PURE v3 client
const cognito = new CognitoIdentityProviderClient({
  region: REGION || process.env.AWS_REGION || "ap-south-1",
});

module.exports = {
  cognito,

  // commands
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  GetUserCommand,
  AdminListGroupsForUserCommand,
  GlobalSignOutCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  ChangePasswordCommand,
  ResendConfirmationCodeCommand,
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
  AdminSetUserPasswordCommand,

  // environment values
  USER_POOL_ID,
  APP_CLIENT_ID,
};
