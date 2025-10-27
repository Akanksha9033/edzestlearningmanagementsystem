// Services/aws/jose.js
// ✅ Fully compatible with CommonJS (Node 18+)
// ✅ Works with modern ESM-only jose package

const { REGION, USER_POOL_ID, APP_CLIENT_ID } = require("../constants");

const ISSUER = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;

/**
 * ✅ Dynamically import jose (ESM-only)
 */
async function getJose() {
  return await import("jose");
}

/**
 * ✅ Create JWKS set dynamically
 */
async function getJWKS() {
  const jose = await getJose();
  const { createRemoteJWKSet } = jose;
  return createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks.json`));
}

/**
 * ✅ Verify Cognito JWT token (access or id)
 */
async function verifyCognitoToken(token) {
  const jose = await getJose();
  const { jwtVerify } = jose;
  const JWKS = await getJWKS();

  const { payload } = await jwtVerify(token, JWKS, { issuer: ISSUER });

  if (!["access", "id"].includes(payload.token_use))
    throw new Error("bad token_use");

  if (
    payload.token_use === "id" &&
    payload.aud &&
    APP_CLIENT_ID &&
    payload.aud !== APP_CLIENT_ID
  )
    throw new Error("bad audience");

  return payload;
}

module.exports = {
  ISSUER,
  getJose,
  getJWKS,
  verifyCognitoToken,
};
