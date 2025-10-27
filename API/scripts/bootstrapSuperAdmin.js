// scripts/bootstrapSuperAdmin.js
try {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
} catch (e) {
  if (e.code !== 'MODULE_NOT_FOUND') throw e;
}
const AWS = require('aws-sdk');

const REGION       = process.env.COGNITO_REGION || process.env.AWS_REGION || 'ap-south-1';
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const USERS_TABLE  = process.env.DDB_USERS_TABLE || 'EdzestUsers';

if (!USER_POOL_ID) {
  console.error('❌ Missing COGNITO_USER_POOL_ID in environment (.env).');
  process.exit(1);
}

AWS.config.update({ region: REGION });
const cognito = new AWS.CognitoIdentityServiceProvider({ region: REGION });
const ddb     = new AWS.DynamoDB.DocumentClient();

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

async function ensureProfile({ sub, email, name }) {
  const now = new Date().toISOString();
  await ddb.put({
    TableName: USERS_TABLE,
    Item: {
      sub,
      email,
      name,
      role: 'SuperAdmin',
      instituteId: null,
      instituteName: '',
      emailVerified: true,
      createdAt: now,
      updatedAt: now
    }
  }).promise();
}

async function run() {
  // Prefer CLI args if provided, otherwise fall back to env SA_*
  const emailArg = process.argv[2];
  const nameArg  = process.argv[3];
  const passArg  = process.argv[4];

  const email = (emailArg || process.env.SA_EMAIL || '').toLowerCase();
  const name = nameArg || process.env.SA_NAME || 'Super Admin';
  const password = passArg || process.env.SA_PASSWORD;

  if (!email || !password) {
    console.log('Usage:');
    console.log('  node scripts/bootstrapSuperAdmin.js <email> "<name>" "<password>"');
    console.log('  # or set SA_EMAIL / SA_NAME / SA_PASSWORD in .env and run without args');
    process.exit(1);
  }

  // Ensure the SuperAdmin group exists
  await ensureGroup('SuperAdmin');

  // Create (or reuse) the user
  let username = email;
  try {
    const cu = await cognito.adminCreateUser({
      UserPoolId: USER_POOL_ID,
      Username: username,
      MessageAction: 'SUPPRESS', // do not send email
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'name', Value: name }
      ]
    }).promise();
    username = cu.User?.Username || username;
  } catch (e) {
    if (e.code !== 'UsernameExistsException') throw e;
  }

  // Set a permanent password
  await cognito.adminSetUserPassword({
    UserPoolId: USER_POOL_ID,
    Username: username,
    Password: password,
    Permanent: true
  }).promise();

  // Add to SuperAdmin group (idempotent)
  try {
    await cognito.adminAddUserToGroup({
      UserPoolId: USER_POOL_ID,
      Username: username,
      GroupName: 'SuperAdmin'
    }).promise();
  } catch (e) {
    if (!['ResourceNotFoundException', 'InvalidParameterException'].includes(e.code)) throw e;
  }

  // Ensure DynamoDB profile
  await ensureProfile({ sub: username, email, name });

  console.log(`✅ SuperAdmin ready: ${email}  pool=${USER_POOL_ID}  region=${REGION}`);
}

run().catch(err => { console.error('❌ Error:', err); process.exit(1); });
