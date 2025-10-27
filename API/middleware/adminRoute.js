
// backend/routes/adminRoute.js
// SuperAdmin can create Admins (per institute)
// Admins can create Teachers (in their institute)
// Uses Amazon Cognito + DynamoDB profile table (EdzestUsers)

// routes/orgAdmin.js
const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
const crypto = require('crypto');
const { authAccess, requireRoles } = require('./auth');

const REGION         = process.env.COGNITO_REGION || process.env.AWS_REGION || 'ap-south-1';
const USER_POOL_ID   = process.env.COGNITO_USER_POOL_ID;
const USERS_TABLE    = process.env.DDB_USERS_TABLE || 'EdzestUsers';
const INSTITUTES_TBL = process.env.DDB_INSTITUTES_TABLE || 'EdzestInstitutes';

AWS.config.update({ region: REGION });
const ddb     = new AWS.DynamoDB.DocumentClient();
const cognito = new AWS.CognitoIdentityServiceProvider({ region: REGION });

const nowISO = () => new Date().toISOString();
const rand8  = () => crypto.randomBytes(6).toString('base64').replace(/[^a-z0-9]/ig,'').slice(0,8);

// DDB helpers
async function put(table, Item) { return ddb.put({ TableName: table, Item }).promise(); }
async function get(table, Key)  { const r = await ddb.get({ TableName: table, Key }).promise(); return r.Item; }
async function queryByInstituteRole(instituteId, role) {
  // Fallback scan (ok for dev). Swap to GSI query if you add one.
  const r = await ddb.scan({
    TableName: USERS_TABLE,
    FilterExpression: '#i = :i AND #r = :r',
    ExpressionAttributeNames: { '#i':'instituteId', '#r':'role' },
    ExpressionAttributeValues: { ':i': instituteId, ':r': role }
  }).promise();
  return r.Items || [];
}

// Cognito helper: create user + add to group
async function createUserAndAddToGroup({ email, name, group, instituteId }) {
  const cu = await cognito.adminCreateUser({
    UserPoolId: USER_POOL_ID,
    Username: email.toLowerCase(),
    DesiredDeliveryMediums: ['EMAIL'],
    UserAttributes: [
      { Name: 'email', Value: email.toLowerCase() },
      { Name: 'name', Value: name },
      { Name: 'email_verified', Value: 'false' },
      ...(process.env.COGNITO_CUSTOM_INST_ATTR
        ? [{ Name: process.env.COGNITO_CUSTOM_INST_ATTR, Value: instituteId }]
        : [])
    ]
  }).promise();

  const username = cu.User?.Username || email.toLowerCase();

  await cognito.adminAddUserToGroup({
    UserPoolId: USER_POOL_ID,
    Username: username,
    GroupName: group
  }).promise();

  return { username };
}

/* ============= SuperAdmin: Institutes ============= */
router.post('/superadmin/institutes', authAccess, requireRoles(['SuperAdmin']), async (req, res) => {
  try {
    let { instituteId, instituteName } = req.body || {};
    if (!instituteName) return res.status(400).json({ message: 'instituteName required' });
    instituteId = (instituteId || rand8()).toLowerCase();
    const now = nowISO();
    await put(INSTITUTES_TBL, { instituteId, instituteName, createdAt: now, updatedAt: now });
    res.status(201).json({ instituteId, instituteName });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/superadmin/institutes', authAccess, requireRoles(['SuperAdmin']), async (_req, res) => {
  const r = await ddb.scan({ TableName: INSTITUTES_TBL }).promise();
  res.json({ items: r.Items || [] });
});

/* ============= SuperAdmin: Admins per institute ============= */
router.post('/superadmin/admins', authAccess, requireRoles(['SuperAdmin']), async (req, res) => {
  try {
    const { name, email, instituteId } = req.body || {};
    if (!name || !email || !instituteId) return res.status(400).json({ message: 'Missing fields' });
    const inst = await get(INSTITUTES_TBL, { instituteId });
    if (!inst) return res.status(404).json({ message: 'Unknown instituteId' });

    const { username } = await createUserAndAddToGroup({ email, name, group: 'Admin', instituteId });

    const now = nowISO();
    const user = {
      sub: username,
      email: email.toLowerCase(),
      name,
      role: 'Admin',
      instituteId,
      instituteName: inst.instituteName,
      emailVerified: false,
      createdAt: now,
      updatedAt: now
    };
    await put(USERS_TABLE, user);
    res.status(201).json({ message: 'Admin invited', user });
  } catch (e) {
    if (e.code === 'UsernameExistsException') return res.status(409).json({ message: 'Email already in use' });
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/superadmin/admins', authAccess, requireRoles(['SuperAdmin']), async (req, res) => {
  const { instituteId } = req.query || {};
  if (!instituteId) return res.status(400).json({ message: 'instituteId required' });
  const items = await queryByInstituteRole(instituteId, 'Admin');
  res.json({ items });
});

// SuperAdmin resets an Admin’s password
router.post('/superadmin/admins/reset-password', authAccess, requireRoles(['SuperAdmin']), async (req, res) => {
  try {
    const { email, newPassword, signOutAll } = req.body || {};
    if (!email || !newPassword) return res.status(400).json({ message: 'Missing fields' });

    await cognito.adminSetUserPassword({
      UserPoolId: USER_POOL_ID,
      Username: String(email).toLowerCase(),
      Password: newPassword,
      Permanent: true
    }).promise();

    if (signOutAll) {
      await cognito.adminUserGlobalSignOut({
        UserPoolId: USER_POOL_ID,
        Username: String(email).toLowerCase()
      }).promise();
    }

    res.json({ message: 'Password reset' });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

/* ============= Admin: Teachers in their institute ============= */
router.post('/admin/teachers', authAccess, requireRoles(['Admin','SuperAdmin']), async (req, res) => {
  try {
    const { name, email, instituteId: bodyInst } = req.body || {};
    if (!name || !email) return res.status(400).json({ message: 'Missing fields' });

    const instituteId = (req.user.role === 'SuperAdmin') ? (bodyInst || req.user.instituteId) : req.user.instituteId;
    if (!instituteId) return res.status(400).json({ message: 'Admin profile missing instituteId' });

    const inst = await get(INSTITUTES_TBL, { instituteId });
    if (!inst) return res.status(404).json({ message: 'Unknown instituteId' });

    const { username } = await createUserAndAddToGroup({ email, name, group: 'Teacher', instituteId });

    const now = nowISO();
    const user = {
      sub: username,
      email: email.toLowerCase(),
      name,
      role: 'Teacher',
      instituteId,
      instituteName: inst.instituteName,
      emailVerified: false,
      createdAt: now,
      updatedAt: now
    };
    await put(USERS_TABLE, user);

    res.status(201).json({ message: 'Teacher invited', user });
  } catch (e) {
    if (e.code === 'UsernameExistsException') return res.status(409).json({ message: 'Email already in use' });
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/admin/teachers', authAccess, requireRoles(['Admin','SuperAdmin']), async (req, res) => {
  const instituteId = (req.user.role === 'SuperAdmin') ? (req.query.instituteId || req.user.instituteId) : req.user.instituteId;
  if (!instituteId) return res.status(400).json({ message: 'Missing instituteId' });
  const items = await queryByInstituteRole(instituteId, 'Teacher');
  res.json({ items });
});

// Admin resets a Teacher’s password (only within their institute)
router.post('/admin/teachers/reset-password', authAccess, requireRoles(['Admin','SuperAdmin']), async (req, res) => {
  try {
    const { email, newPassword, signOutAll } = req.body || {};
    if (!email || !newPassword) return res.status(400).json({ message: 'Missing fields' });

    // (Optional) Enforce institute scoping by checking DDB
    // If you add GSI by email later, switch to fast query; for now a light scan:
    const users = await ddb.scan({
      TableName: USERS_TABLE,
      FilterExpression: '#e = :e',
      ExpressionAttributeNames: { '#e':'email' },
      ExpressionAttributeValues: { ':e': String(email).toLowerCase() }
    }).promise();
    const prof = (users.Items || [])[0];
    if (req.user.role !== 'SuperAdmin') {
      if (!prof || prof.instituteId !== req.user.instituteId || prof.role !== 'Teacher') {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    await cognito.adminSetUserPassword({
      UserPoolId: USER_POOL_ID,
      Username: String(email).toLowerCase(),
      Password: newPassword,
      Permanent: true
    }).promise();

    if (signOutAll) {
      await cognito.adminUserGlobalSignOut({
        UserPoolId: USER_POOL_ID,
        Username: String(email).toLowerCase()
      }).promise();
    }

    res.json({ message: 'Password reset' });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
