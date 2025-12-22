// sdk v3 version

// backend/routes/firstLogin.js (AWS SDK v3 MIGRATED)
const express = require("express");
const router = express.Router();
const { jwtVerify, createRemoteJWKSet } = require("jose");
const crypto = require("crypto");

/* ---------------- AWS SDK v3 Imports ---------------- */
const {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  GetUserCommand,
  AdminListGroupsForUserCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

/* ---------------- ENV ---------------- */
const REGION =
  process.env.COGNITO_REGION || process.env.AWS_REGION || "ap-south-1";
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const APP_CLIENT_ID = process.env.COGNITO_APP_CLIENT_ID;
const USERS_TABLE = process.env.DDB_USERS_TABLE || "EdzestUsers";

/* ---------------- AWS CLIENTS (v3) ---------------- */
const ddbClient = new DynamoDBClient({ region: REGION });
const ddb = DynamoDBDocumentClient.from(ddbClient);

const cognito = new CognitoIdentityProviderClient({ region: REGION });

/* ---------------- JOSE Token Verify ---------------- */
const ISSUER = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;
const JWKS = createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks.json`));

/* ---------------- Role Priority ---------------- */
const ORDERED_ROLES = ["SuperAdmin", "Admin", "Teacher", "Student"];
const pickHighestRole = (g = []) => {
  const s = new Set(g);
  for (const r of ORDERED_ROLES) if (s.has(r)) return r;
  return "Student";
};

/* ---------------- Helpers ---------------- */

// Save/Update user profile in DDB (v3)
async function ensureProfile(user) {
  await ddb.send(
    new PutCommand({
      TableName: USERS_TABLE,
      Item: {
        ...user,
        updatedAt: new Date().toISOString(),
      },
    })
  );
}

// Set refresh cookie (unchanged)
function setRefreshCookie(res, refreshToken) {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

/* -------------------------------------------------------------
    FIRST LOGIN — NEW_PASSWORD_REQUIRED FLOW (SDK v3)
--------------------------------------------------------------- */

router.post("/auth/first-login", async (req, res) => {
  try {
    const { email, tempPassword, newPassword } = req.body || {};
    if (!email || !tempPassword || !newPassword)
      return res.status(400).json({ message: "Missing fields" });

    const username = email.toLowerCase();

    /*  
      STEP 1: initiateAuth with temp password 
    */
    const init = await cognito.send(
      new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: APP_CLIENT_ID,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: tempPassword,
        },
      })
    );

    if (init.ChallengeName !== "NEW_PASSWORD_REQUIRED") {
      return res.status(400).json({ message: "First-login not required" });
    }

    /*  
      STEP 2: Respond to challenge with new password
    */
    const resp = await cognito.send(
      new RespondToAuthChallengeCommand({
        ClientId: APP_CLIENT_ID,
        ChallengeName: "NEW_PASSWORD_REQUIRED",
        Session: init.Session,
        ChallengeResponses: {
          USERNAME: username,
          NEW_PASSWORD: newPassword,
        },
      })
    );

    const accessToken = resp.AuthenticationResult.AccessToken;
    const idToken = resp.AuthenticationResult.IdToken;
    const refreshToken = resp.AuthenticationResult.RefreshToken;

    /*  
      STEP 3: Fetch user attributes 
    */
    const me = await cognito.send(
      new GetUserCommand({ AccessToken: accessToken })
    );

    const attrs = Object.fromEntries(
      (me.UserAttributes || []).map((a) => [a.Name, a.Value])
    );

    const emailVerified = attrs.email_verified === "true";
    const name =
      attrs.name || (attrs.email ? attrs.email.split("@")[0] : "User");

    /*  
      STEP 4: Get user groups 
    */
    const groupsResp = await cognito.send(
      new AdminListGroupsForUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
      })
    );

    const groups = (groupsResp.Groups || []).map((g) => g.GroupName);
    const role = pickHighestRole(groups);

    /*  
      STEP 5: Extract SUB from ID Token 
    */
    let sub;
    try {
      const { payload } = await jwtVerify(idToken, JWKS, { issuer: ISSUER });
      sub = payload.sub;
    } catch {
      sub = attrs.sub;
    }

    /*  
      STEP 6: Save user profile in DynamoDB 
    */
    await ensureProfile({
      sub,
      email: username,
      name,
      role,
      emailVerified,
    });

    /*  
      STEP 7: Set refresh cookie 
    */
    setRefreshCookie(res, refreshToken);

    /*  
      STEP 8: Final response 
    */
    const user = {
      id: sub,
      _id: sub,
      name,
      email: username,
      role,
      instituteId: null,
      instituteName: "",
      emailVerified,
    };

    return res.json({ accessToken, user, refreshTtlDays: 30 });
  } catch (e) {
    console.error("🔥 FIRST LOGIN ERROR:", e);
    const msg =
      e.code === "NotAuthorizedException"
        ? "Invalid credentials"
        : "Server error";
    const status = e.code === "NotAuthorizedException" ? 401 : 500;
    return res.status(status).json({ message: msg });
  }
});

module.exports = router;
