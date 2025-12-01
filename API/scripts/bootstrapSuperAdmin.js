// scripts/bootstrapSuperAdmin.js

// ------------------------------------------------------------------
// Load .env from ../.env (SAFE fallback if dotenv not installed)
// ------------------------------------------------------------------
try {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
} catch (e) {
  if (e.code !== 'MODULE_NOT_FOUND') throw e;
}

// ------------------------------------------------------------------
// AWS SDK v2 is used because:
// This script is run ONE TIME locally to bootstrap a SuperAdmin.
// It's not part of Lambda/API → v2 is fine here.
// ------------------------------------------------------------------
const AWS = require('aws-sdk');

// Region + Cognito config + Dynamo table
const REGION       = process.env.COGNITO_REGION || process.env.AWS_REGION || 'ap-south-1';
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const USERS_TABLE  = process.env.DDB_USERS_TABLE || 'EdzestUsers';

// ------------------------------------------------------------------
// Ensure Cognito User Pool exists
// ------------------------------------------------------------------
if (!USER_POOL_ID) {
  console.error('❌ Missing COGNITO_USER_POOL_ID in environment (.env).');
  process.exit(1);
}

// Apply region globally
AWS.config.update({ region: REGION });

// Create service clients
const cognito = new AWS.CognitoIdentityServiceProvider({ region: REGION });
const ddb     = new AWS.DynamoDB.DocumentClient();

// ------------------------------------------------------------------
// ensureGroup()
// Makes sure "SuperAdmin" group exists in Cognito
// If not → Create it.
// ------------------------------------------------------------------
async function ensureGroup(groupName) {
  try {
    await cognito.getGroup({ UserPoolId: USER_POOL_ID, GroupName: groupName }).promise();
  } catch (e) {
    if (e.code === 'ResourceNotFoundException') {
      await cognito.createGroup({ UserPoolId: USER_POOL_ID, GroupName: groupName }).promise();
    } else {
      throw e;
    }
  }
}

// ------------------------------------------------------------------
// ensureProfile()
// Creates a DynamoDB profile for the SuperAdmin user
// Always overwrites existing profile → idempotent
// ------------------------------------------------------------------
async function ensureProfile({ sub, email, name }) {
  const now = new Date().toISOString();
  await ddb.put({
    TableName: USERS_TABLE,
    Item: {
      sub,
      email,
      name,
      role: 'SuperAdmin',      // user role in LMS
      instituteId: null,
      instituteName: '',
      emailVerified: true,
      createdAt: now,
      updatedAt: now
    }
  }).promise();
}

// ------------------------------------------------------------------
// MAIN RUN FUNCTION
// This bootstraps:
// 1) Cognito Group
// 2) Cognito User
// 3) Permanent password
// 4) Assign user to SuperAdmin group
// 5) Create DynamoDB profile
// ------------------------------------------------------------------
async function run() {

  // CLI arguments: node script.js email "Name" "Password"
  const emailArg = process.argv[2];
  const nameArg  = process.argv[3];
  const passArg  = process.argv[4];

  // Fallback to env if CLI args missing
  const email = (emailArg || process.env.SA_EMAIL || '').toLowerCase();
  const name = nameArg || process.env.SA_NAME || 'Super Admin';
  const password = passArg || process.env.SA_PASSWORD;

  // If email/password missing → Show usage instruction
  if (!email || !password) {
    console.log('Usage:');
    console.log('  node scripts/bootstrapSuperAdmin.js <email> "<name>" "<password>"');
    console.log('  # or set SA_EMAIL / SA_NAME / SA_PASSWORD in .env and run without args');
    process.exit(1);
  }

  // --------------------------------------------------------------
  // Step 1: Ensure "SuperAdmin" group exists in Cognito
  // --------------------------------------------------------------
  await ensureGroup('SuperAdmin');

  // --------------------------------------------------------------
  // Step 2: Create Cognito user (or ignore if exists)
  // --------------------------------------------------------------
  let username = email;
  try {
    const cu = await cognito.adminCreateUser({
      UserPoolId: USER_POOL_ID,
      Username: username,
      MessageAction: 'SUPPRESS', // DO NOT send verification email
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'name', Value: name }
      ]
    }).promise();

    username = cu.User?.Username || username;

  } catch (e) {
    // If already exists → OK
    if (e.code !== 'UsernameExistsException') throw e;
  }

  // --------------------------------------------------------------
  // Step 3: Set permanent password
  // --------------------------------------------------------------
  await cognito.adminSetUserPassword({
    UserPoolId: USER_POOL_ID,
    Username: username,
    Password: password,
    Permanent: true
  }).promise();

  // --------------------------------------------------------------
  // Step 4: Add user to SuperAdmin group (idempotent)
  // --------------------------------------------------------------
  try {
    await cognito.adminAddUserToGroup({
      UserPoolId: USER_POOL_ID,
      Username: username,
      GroupName: 'SuperAdmin'
    }).promise();
  } catch (e) {
    if (!['ResourceNotFoundException', 'InvalidParameterException'].includes(e.code)) throw e;
  }

  // --------------------------------------------------------------
  // Step 5: Ensure DynamoDB profile exists
  // --------------------------------------------------------------
  await ensureProfile({ sub: username, email, name });

  console.log(`✅ SuperAdmin ready: ${email}  pool=${USER_POOL_ID}  region=${REGION}`);
}

// Run bootstrap script safely
run().catch(err => { console.error('❌ Error:', err); process.exit(1); });
