

const crypto = require("crypto");
const {
  CognitoIdentityProviderClient,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

// ENV VARS (configure these in Lambda)
// COGNITO_REGION=ap-south-1
// COGNITO_APP_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
// COGNITO_APP_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxx   <-- only if your app client has a secret
const REGION = process.env.COGNITO_REGION;
const CLIENT_ID = process.env.COGNITO_APP_CLIENT_ID;
const CLIENT_SECRET = process.env.COGNITO_APP_CLIENT_SECRET || ""; // optional

// Single Cognito IDP client
const cip = new CognitoIdentityProviderClient({ region: REGION });

/**
 * Compute SecretHash when using an App Client with a secret.
 * HMAC-SHA256 over username + clientId, keyed with clientSecret, base64-encoded.
 * If no CLIENT_SECRET, returns undefined (so the param is omitted).
 */
function computeSecretHash(username) {
  if (!CLIENT_SECRET) return undefined;
  return crypto
    .createHmac("sha256", CLIENT_SECRET)
    .update(String(username) + String(CLIENT_ID))
    .digest("base64");
}

/**
 * Start the Forgot Password flow.
 * If your app client has a secret, we include SecretHash. Otherwise we omit it.
 */
async function startForgotPassword(username) {
  const u = String(username || "").trim();
  if (!u) throw Object.assign(new Error("USERNAME_REQUIRED"), { name: "USERNAME_REQUIRED" });

  const params = {
    ClientId: CLIENT_ID,
    Username: u,
  };

  const sh = computeSecretHash(u);
  if (sh) params.SecretHash = sh;

  return await cip.send(new ForgotPasswordCommand(params));
}

/**
 * Confirm Forgot Password with the code the user received via email.
 * Also includes SecretHash if your app client uses a secret.
 */
async function confirmForgotPassword({ username, code, newPassword }) {
  const u = String(username || "").trim();
  const c = String(code || "").trim();
  const p = String(newPassword || "");

  if (!u) throw Object.assign(new Error("USERNAME_REQUIRED"), { name: "USERNAME_REQUIRED" });
  if (!c) throw Object.assign(new Error("CODE_REQUIRED"), { name: "CODE_REQUIRED" });
  if (!p) throw Object.assign(new Error("PASSWORD_REQUIRED"), { name: "PASSWORD_REQUIRED" });

  const params = {
    ClientId: CLIENT_ID,
    Username: u,
    ConfirmationCode: c,
    Password: p,
  };

  const sh = computeSecretHash(u);
  if (sh) params.SecretHash = sh;

  return await cip.send(new ConfirmForgotPasswordCommand(params));
}

module.exports = { startForgotPassword, confirmForgotPassword };
