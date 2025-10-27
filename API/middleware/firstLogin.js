// // backend/routes/firstLogin.js
// const express = require('express');
// const router = express.Router();
// const AWS = require('aws-sdk');
// const { jwtVerify, createRemoteJWKSet } = require('jose');

// const REGION = process.env.COGNITO_REGION || process.env.AWS_REGION || 'ap-south-1';
// const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
// const APP_CLIENT_ID = process.env.COGNITO_APP_CLIENT_ID;
// const USERS_TABLE = process.env.DDB_USERS_TABLE || 'EdzestUsers';

// AWS.config.update({ region: REGION });
// const ddb     = new AWS.DynamoDB.DocumentClient();
// const cognito = new AWS.CognitoIdentityServiceProvider({ region: REGION });

// const ISSUER = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;
// const JWKS   = createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks.json`));
// const ORDERED_ROLES = ['SuperAdmin', 'Admin', 'Teacher', 'Student'];
// const pickHighestRole = (g=[]) => {const s=new Set(g);for(const r of ORDERED_ROLES) if(s.has(r)) return r; return 'Student';};

// async function ensureProfile(user) {
//   await ddb.put({ TableName: USERS_TABLE, Item: { ...user, updatedAt: new Date().toISOString() } }).promise();
// }
// function setRefreshCookie(res, refreshToken) {
//   res.cookie('refreshToken', refreshToken, {
//     httpOnly: true, sameSite: 'lax',
//     secure: process.env.NODE_ENV === 'production',
//     path: '/api/auth',
//     maxAge: 30*24*60*60*1000
//   });
// }

// /** Body: { email, tempPassword, newPassword } */
// router.post('/auth/first-login', async (req, res) => {
//   try {
//     const { email, tempPassword, newPassword } = req.body || {};
//     if (!email || !tempPassword || !newPassword) return res.status(400).json({ message: 'Missing fields' });

//     const init = await cognito.initiateAuth({
//       AuthFlow: 'USER_PASSWORD_AUTH',
//       ClientId: APP_CLIENT_ID,
//       AuthParameters: { USERNAME: email.toLowerCase(), PASSWORD: tempPassword },
//     }).promise();
//     if (init.ChallengeName !== 'NEW_PASSWORD_REQUIRED') {
//       return res.status(400).json({ message: 'First-login not required' });
//     }

//     const resp = await cognito.respondToAuthChallenge({
//       ClientId: APP_CLIENT_ID,
//       ChallengeName: 'NEW_PASSWORD_REQUIRED',
//       Session: init.Session,
//       ChallengeResponses: { USERNAME: email.toLowerCase(), NEW_PASSWORD: newPassword }
//     }).promise();

//     const accessToken  = resp.AuthenticationResult.AccessToken;
//     const idToken      = resp.AuthenticationResult.IdToken;
//     const refreshToken = resp.AuthenticationResult.RefreshToken;

//     const me = await cognito.getUser({ AccessToken: accessToken }).promise();
//     const attrs = Object.fromEntries(me.UserAttributes.map(a => [a.Name, a.Value]));
//     const emailVerified = attrs.email_verified === 'true';
//     const name = attrs.name || (attrs.email ? attrs.email.split('@')[0] : 'User');

//     const groupsResp = await cognito.adminListGroupsForUser({ UserPoolId: USER_POOL_ID, Username: email.toLowerCase() }).promise();
//     const groups = (groupsResp.Groups || []).map(g => g.GroupName);
//     const role = pickHighestRole(groups);

//     let sub;
//     try {
//       const { payload } = await jwtVerify(idToken, JWKS, { issuer: ISSUER });
//       sub = payload.sub;
//     } catch { sub = attrs.sub; }

//     await ensureProfile({ sub, email: email.toLowerCase(), name, role, emailVerified });

//     setRefreshCookie(res, refreshToken);
//     const user = { id: sub, _id: sub, name, email: email.toLowerCase(), role, instituteId: null, instituteName: '', emailVerified };
//     return res.json({ accessToken, user, refreshTtlDays: 30 });
//   } catch (e) {
//     const msg = e.code === 'NotAuthorizedException' ? 'Invalid credentials' : 'Server error';
//     const status = e.code === 'NotAuthorizedException' ? 401 : 500;
//     return res.status(status).json({ message: msg });
//   }
// });

// module.exports = router;


// backend/routes/firstLogin.js
// backend/routes/firstLogin.js
const { setRefreshCookie } = require('../middleware/helpers/cookies');

const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
const { jwtVerify, createRemoteJWKSet } = require('jose');

const REGION = process.env.COGNITO_REGION || process.env.AWS_REGION || 'ap-south-1';
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const APP_CLIENT_ID = process.env.COGNITO_APP_CLIENT_ID;
const USERS_TABLE = process.env.DDB_USERS_TABLE || 'EdzestUsers';

AWS.config.update({ region: REGION });
const ddb     = new AWS.DynamoDB.DocumentClient();
const cognito = new AWS.CognitoIdentityServiceProvider({ region: REGION });

const ISSUER = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;
const JWKS   = createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks.json`));
const ORDERED_ROLES = ['SuperAdmin', 'Admin', 'Teacher', 'Student'];
const pickHighestRole = (g = []) => { const s = new Set(g); for (const r of ORDERED_ROLES) if (s.has(r)) return r; return 'Student'; };

async function ensureProfile(user) {
  await ddb.put({ TableName: USERS_TABLE, Item: { ...user, updatedAt: new Date().toISOString() } }).promise();
}

/** Body: { email, tempPassword, newPassword } */
router.post('/auth/first-login', async (req, res) => {
  try {
    const { email, tempPassword, newPassword } = req.body || {};
    if (!email || !tempPassword || !newPassword) return res.status(400).json({ message: 'Missing fields' });

    const init = await cognito.initiateAuth({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: APP_CLIENT_ID,
      AuthParameters: { USERNAME: email.toLowerCase(), PASSWORD: tempPassword },
    }).promise();

    if (init.ChallengeName !== 'NEW_PASSWORD_REQUIRED') {
      return res.status(400).json({ message: 'First-login not required' });
    }

    const resp = await cognito.respondToAuthChallenge({
      ClientId: APP_CLIENT_ID,
      ChallengeName: 'NEW_PASSWORD_REQUIRED',
      Session: init.Session,
      ChallengeResponses: { USERNAME: email.toLowerCase(), NEW_PASSWORD: newPassword }
    }).promise();

    const accessToken  = resp.AuthenticationResult.AccessToken;
    const idToken      = resp.AuthenticationResult.IdToken;
    const refreshToken = resp.AuthenticationResult.RefreshToken;

    const me = await cognito.getUser({ AccessToken: accessToken }).promise();
    const attrs = Object.fromEntries(me.UserAttributes.map(a => [a.Name, a.Value]));
    const emailVerified = attrs.email_verified === 'true';
    const name = attrs.name || (attrs.email ? attrs.email.split('@')[0] : 'User');

    const groupsResp = await cognito.adminListGroupsForUser({ UserPoolId: USER_POOL_ID, Username: email.toLowerCase() }).promise();
    const groups = (groupsResp.Groups || []).map(g => g.GroupName);
    const role = pickHighestRole(groups);

    let sub;
    try {
      const { payload } = await jwtVerify(idToken, JWKS, { issuer: ISSUER });
      sub = payload.sub;
    } catch {
      sub = attrs.sub;
    }

    await ensureProfile({ sub, email: email.toLowerCase(), name, role, emailVerified });

    // Use shared helper (handles localhost vs HTTPS flags). No logic change.
    setRefreshCookie(req, res, refreshToken);

    const user = { id: sub, _id: sub, name, email: email.toLowerCase(), role, instituteId: null, instituteName: '', emailVerified };
    return res.json({ accessToken, user, refreshTtlDays: 30 });
  } catch (e) {
    const msg = e.code === 'NotAuthorizedException' ? 'Invalid credentials' : 'Server error';
    const status = e.code === 'NotAuthorizedException' ? 401 : 500;
    return res.status(status).json({ message: msg });
  }
});

module.exports = router;
