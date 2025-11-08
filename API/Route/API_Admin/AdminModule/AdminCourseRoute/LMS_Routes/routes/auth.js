const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const AWS = require('aws-sdk');
const { jwtVerify, createRemoteJWKSet } = require('jose');

const REGION = process.env.COGNITO_REGION || process.env.AWS_REGION || 'ap-south-1';
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const APP_CLIENT_ID = process.env.COGNITO_APP_CLIENT_ID;
const USERS_TABLE = process.env.DDB_USERS_TABLE || 'EdzestUsers';

AWS.config.update({ region: REGION });

const ddb = new AWS.DynamoDB.DocumentClient();
const cognito = new AWS.CognitoIdentityServiceProvider({ region: REGION });

const tight = rateLimit({ windowMs: 60 * 1000, max: 20 });
const looser = rateLimit({ windowMs: 60 * 60 * 1000, max: 200 });

/** ===== Helpers ===== */
const ISSUER = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;
const JWKS = createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks.json`));

const ORDERED_ROLES = ['SuperAdmin', 'Admin', 'Teacher', 'Student'];
const pickHighestRole = (groups = []) => {
  const s = new Set(groups);
  for (const r of ORDERED_ROLES) if (s.has(r)) return r;
  return 'Student';
};

function setRefreshCookie(res, refreshToken) {
  // mimic your previous cookie (path under /api/auth), httpOnly & sameSite
  const maxAgeDays = 30; // you can tune this
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/auth',
    maxAge: maxAgeDays * 24 * 60 * 60 * 1000,
  });
}

async function ensureProfile({ sub, email, name, role, emailVerified }) {
  const now = new Date().toISOString();
  // 1) try the correct (uuid) key
  let { Item } = await ddb.get({ TableName: USERS_TABLE, Key: { sub } }).promise();

  if (!Item) {
    // 2) migrate/merge from legacy item keyed by email-as-sub
    const scan = await ddb.scan({
      TableName: USERS_TABLE,
      FilterExpression: '#e = :e',
      ExpressionAttributeNames: { '#e': 'email' },
      ExpressionAttributeValues: { ':e': String(email).toLowerCase() }
    }).promise();
    const legacy = (scan.Items || [])[0];

    Item = {
      sub,
      email: String(email).toLowerCase(),
      name,
      // prefer institute/role from legacy if present
      role: (legacy && legacy.role) ? legacy.role : role,
      instituteId: legacy?.instituteId || null,
      instituteName: legacy?.instituteName || '',
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
  if (dirty) {
    Item.updatedAt = now;
    await ddb.put({ TableName: USERS_TABLE, Item }).promise();
  }
  return Item;
}


/** Auth middleware (verifies Cognito JWT, attaches req.user from DynamoDB) */
async function authAccess(req, res, next) {
  try {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const { payload } = await jwtVerify(token, JWKS, { issuer: ISSUER });
    if (!['access', 'id'].includes(payload.token_use)) throw new Error('bad token use');
    if (payload.token_use === 'id' && payload.aud && APP_CLIENT_ID && payload.aud !== APP_CLIENT_ID) {
      throw new Error('bad audience');
    }

    const sub = payload.sub;
    const email = payload.email || '';
    const name = payload.name || (email ? email.split('@')[0] : 'User');
    const groups = payload['cognito:groups'] || [];
    const role = pickHighestRole(groups);
    const emailVerified = !!payload.email_verified;

    const profile = await ensureProfile({ sub, email, name, role, emailVerified });

    req.user = { ...profile, _id: profile.sub, id: profile.sub };
    req.cognito = { sub, groups, tokenUse: payload.token_use, raw: payload };
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

/** ===== Routes (compatible shapes) ===== */

/** Public: Register (Student) — creates Cognito user; Cognito emails code */
router.post('/register', tight, async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });

    await cognito
      .signUp({
        ClientId: APP_CLIENT_ID,
        Username: String(email).trim().toLowerCase(),
        Password: password,
        UserAttributes: [
          { Name: 'email', Value: String(email).trim().toLowerCase() },
          { Name: 'name', Value: name },
        ],
      })
      .promise();

    // Pre-create a Student profile (emailVerified will flip true after confirm)
    await ensureProfile({
      sub: `pending:${email.toLowerCase()}`, // temporary placeholder until first login
      email: email.toLowerCase(),
      name,
      role: 'Student',
      emailVerified: false,
    });

    return res.status(201).json({ message: 'Registered. Check your email for the verification code.' });
  } catch (e) {
    if (e.code === 'UsernameExistsException') {
      return res.status(409).json({ message: 'Email already in use' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
});

/** Public: Verify email — uses Cognito confirmSignUp(code) */
router.post('/verify-email', tight, async (req, res) => {
  try {
    // Accept { email, code } (preferred). For backward compatibility,
    // if { token, userId } comes, treat token as the code and userId as email when it looks like an email.
    let { email, code, token, userId } = req.body || {};
    if (!code && token) code = token;
    if (!email && userId && String(userId).includes('@')) email = userId;

    if (!email || !code) return res.status(400).json({ message: 'Bad request' });

    await cognito
      .confirmSignUp({
        ClientId: APP_CLIENT_ID,
        Username: String(email).toLowerCase(),
        ConfirmationCode: String(code),
      })
      .promise();

    return res.json({ message: 'Email verified' });
  } catch (e) {
    return res.status(400).json({ message: 'Invalid or expired code' });
  }
});



router.post('/login', tight, async (req, res) => {
  try {
    const { email, password, newPassword /*, deviceName */ } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Missing fields' });

    const username = String(email).toLowerCase();

    // 1) Start auth with the provided password (temp or permanent)
    const init = await cognito.initiateAuth({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: APP_CLIENT_ID,
      AuthParameters: { USERNAME: username, PASSWORD: password },
    }).promise();

    // 2) First-time login flow (NEW_PASSWORD_REQUIRED)
    if (init.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
      if (!newPassword) {
        // Tell the client to prompt for new password
        return res.status(409).json({
          challenge: 'NEW_PASSWORD_REQUIRED',
          message: 'NEW_PASSWORD_REQUIRED'
        });
      }

      // Complete the challenge in-line
      const fin = await cognito.respondToAuthChallenge({
        ClientId: APP_CLIENT_ID,
        ChallengeName: 'NEW_PASSWORD_REQUIRED',
        Session: init.Session,
        ChallengeResponses: {
          USERNAME: username,
          NEW_PASSWORD: newPassword,
          // If your pool requires additional attributes at this step,
          // include them as ChallengeResponses, e.g. 'userAttributes.name': 'Full Name'
        }
      }).promise();

      // Use final tokens
      init.AuthenticationResult = fin.AuthenticationResult;
    }

    // 3) Normal success path (unchanged)
    const accessToken  = init.AuthenticationResult.AccessToken;
    const idToken      = init.AuthenticationResult.IdToken;
    const refreshToken = init.AuthenticationResult.RefreshToken;

    // read user attributes & groups
    const me    = await cognito.getUser({ AccessToken: accessToken }).promise();
    const attrs = Object.fromEntries(me.UserAttributes.map(a => [a.Name, a.Value]));
    const emailVerified = attrs.email_verified === 'true';
    const name  = attrs.name || (attrs.email ? attrs.email.split('@')[0] : 'User');

    const groupsResp = await cognito
      .adminListGroupsForUser({ UserPoolId: USER_POOL_ID, Username: username })
      .promise();
    const groups = (groupsResp.Groups || []).map(g => g.GroupName);
    const role   = pickHighestRole(groups);

    let sub;
    try {
      const { payload } = await jwtVerify(idToken, JWKS, { issuer: ISSUER });
      sub = payload.sub;
    } catch {
      sub = attrs.sub;
    }

    await ensureProfile({ sub, email: username, name, role, emailVerified });

    setRefreshCookie(res, refreshToken);
    const safeUser = {
      id: sub, _id: sub, name, email: username, role,
      instituteId: null, instituteName: '', emailVerified
    };

    return res.json({ accessToken, user: safeUser, refreshTtlDays: 30 });
  } catch (e) {
    if (e.code === 'NotAuthorizedException') {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }
    if (e.code === 'UserNotFoundException') {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }
    if (e.code === 'UserNotConfirmedException') {
      return res.status(403).json({ message: 'Email not verified.' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
});



/** Public: Refresh — uses REFRESH_TOKEN_AUTH with cookie */
router.post('/refresh', tight, async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh' });

    const resp = await cognito
      .initiateAuth({
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: APP_CLIENT_ID,
        AuthParameters: { REFRESH_TOKEN: token },
      })
      .promise();

    const accessToken = resp.AuthenticationResult.AccessToken;
    // Cognito may not rotate refresh token here; keep cookie as-is
    return res.json({ accessToken });
  } catch (e) {
    return res.status(401).json({ message: 'Refresh failed' });
  }
});

/** Authenticated: Logout — clear cookie; optionally global sign-out */
router.post('/logout', looser, async (req, res) => {
  try {
    const hdr = req.headers.authorization || '';
    const accessToken = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (accessToken) {
      try { await cognito.globalSignOut({ AccessToken: accessToken }).promise(); } catch {}
    }
    res.clearCookie('refreshToken', { path: '/api/auth' });
    return res.json({ message: 'Logged out' });
  } catch {
    return res.json({ message: 'Logged out' });
  }
});

/** Public: resend verification code (Cognito sends it) */
router.post('/resend-verify', tight, async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Email required' });

    await cognito
      .resendConfirmationCode({ ClientId: APP_CLIENT_ID, Username: String(email).toLowerCase() })
      .promise();

    return res.json({ message: 'Verification email resent' });
  } catch (e) {
    return res.status(502).json({ message: 'Failed to send verification email' });
  }
});

/** Authenticated: Me — now comes from DynamoDB profile */
router.get('/me', authAccess, async (req, res) => {
  const u = req.user;
  return res.json({
    id: u._id, name: u.name, email: u.email, role: u.role,
    instituteId: u.instituteId || null, instituteName: u.instituteName || '', emailVerified: u.emailVerified
  });
});

/** Authenticated: Sessions — not available in Cognito; return empty */
router.get('/sessions', authAccess, async (req, res) => {
  return res.json({ sessions: [] });
});

/** Authenticated: Logout all — clear cookie; you can revoke tokens by changing passwords/MFA */
router.post('/logout-all', authAccess, async (req, res) => {
  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.json({ message: 'Logged out from all devices' });
});



// POST /api/auth/change-password  { oldPassword, newPassword }
router.post('/change-password', authAccess, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body || {};
    const hdr = req.headers.authorization || '';
    const accessToken = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!oldPassword || !newPassword || !accessToken) {
      return res.status(400).json({ message: 'Missing fields' });
    }
    await cognito.changePassword({
      PreviousPassword: oldPassword,
      ProposedPassword: newPassword,
      AccessToken: accessToken
    }).promise();
    res.json({ message: 'Password updated' });
  } catch (e) {
    const msg = e.code === 'NotAuthorizedException' ? 'Old password incorrect' : 'Server error';
    const status = e.code === 'NotAuthorizedException' ? 401 : 500;
    res.status(status).json({ message: msg });
  }
});


// POST /api/auth/forgot-password { email }
router.post('/forgot-password', tight, async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Email required' });
    await cognito.forgotPassword({
      ClientId: APP_CLIENT_ID,
      Username: String(email).toLowerCase()
    }).promise();
    res.json({ message: 'Reset code sent' });
  } catch (e) {
    // don’t reveal existence; always OK
    res.json({ message: 'Reset code sent' });
  }
});

// POST /api/auth/confirm-forgot-password { email, code, newPassword }
router.post('/confirm-forgot-password', tight, async (req, res) => {
  try {
    const { email, code, newPassword } = req.body || {};
    if (!email || !code || !newPassword) return res.status(400).json({ message: 'Missing fields' });
    await cognito.confirmForgotPassword({
      ClientId: APP_CLIENT_ID,
      Username: String(email).toLowerCase(),
      ConfirmationCode: String(code),
      Password: newPassword
    }).promise();
    res.json({ message: 'Password reset' });
  } catch (e) {
    res.status(400).json({ message: 'Invalid code or password policy' });
  }
});


module.exports = router;
