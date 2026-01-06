// // API/middleware/adminUsersRoute.js

// const express = require("express");
// const router = express.Router();

// const { authAccess, requireRoles } = require("./auth");

// /* ---------------- AWS SDK v3 ---------------- */
// const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
// const {
//   DynamoDBDocumentClient,
//   GetCommand,
//   PutCommand,
// } = require("@aws-sdk/lib-dynamodb");

// const {
//   CognitoIdentityProviderClient,
//   AdminCreateUserCommand,
//   AdminAddUserToGroupCommand,
// } = require("@aws-sdk/client-cognito-identity-provider");

// /* ---------------- Config ---------------- */
// const REGION =
//   process.env.COGNITO_REGION ||
//   process.env.AWS_REGION ||
//   "ap-south-1";

// const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

// // Tables (NO schema change)
// const USERS_TABLE = process.env.DDB_USERS_TABLE || "EdzestUsers";
// const INSTITUTES_TBL =
//   process.env.DDB_INSTITUTES_TABLE || "EdzestInstitutes";

// // ✅ Existing institute PK from DynamoDB
// const DEFAULT_INSTITUTE_ID = "0z2w1ep"; // instituteld

// /* ---------------- Clients ---------------- */
// const ddbClient = new DynamoDBClient({ region: REGION });
// const ddb = DynamoDBDocumentClient.from(ddbClient);

// const cognito = new CognitoIdentityProviderClient({ region: REGION });

// const nowISO = () => new Date().toISOString();

// /* ---------------- Helpers ---------------- */
// async function get(table, Key) {
//   const r = await ddb.send(
//     new GetCommand({
//       TableName: table,
//       Key,
//     })
//   );
//   return r.Item;
// }

// async function put(table, Item) {
//   await ddb.send(
//     new PutCommand({
//       TableName: table,
//       Item,
//     })
//   );
// }

// /* ---------------- Cognito helper ---------------- */
// async function createUserAndAddToGroup({
//   email,
//   name,
//   group,
//   instituteId,
// }) {
//   console.log("COGNITO → Creating user:", email);

//   const createRes = await cognito.send(
//     new AdminCreateUserCommand({
//       UserPoolId: USER_POOL_ID,
//       Username: email.toLowerCase(),
//       DesiredDeliveryMediums: ["EMAIL"],
//       UserAttributes: [
//         { Name: "email", Value: email.toLowerCase() },
//         { Name: "name", Value: name },
//         { Name: "email_verified", Value: "false" },
//         ...(process.env.COGNITO_CUSTOM_INST_ATTR
//           ? [
//               {
//                 Name: process.env.COGNITO_CUSTOM_INST_ATTR,
//                 Value: instituteId,
//               },
//             ]
//           : []),
//       ],
//     })
//   );

//   const username =
//     createRes.User?.Username || email.toLowerCase();

//   console.log("COGNITO → Adding user to group:", group);

//   await cognito.send(
//     new AdminAddUserToGroupCommand({
//       UserPoolId: USER_POOL_ID,
//       Username: username,
//       GroupName: group,
//     })
//   );

//   return { username };
// }

// /**
//  * -------------------------------------------------------
//  * POST /api/admin/users/students
//  * -------------------------------------------------------
//  */
// router.post(
//   "/students",
//   authAccess,
//   requireRoles(["admin", "superadmin"]),
//   async (req, res) => {
//     try {
//       console.log("========== ADMIN ADD STUDENT ==========");
//       console.log("REQ BODY =", JSON.stringify(req.body, null, 2));
//       console.log("REQ USER =", JSON.stringify(req.user, null, 2));

//       const { name, email, access } = req.body || {};

//       if (!name || !email) {
//         console.log("❌ Missing name or email");
//         return res.status(400).json({ message: "Missing name/email" });
//       }

//       /* ---------------- Resolve instituteId ---------------- */
//       let instituteId = req.user?.instituteId;

//       console.log("STEP 1 instituteId from req.user =", instituteId);
//       console.log("STEP 1 role =", req.user?.role);

//       // ✅ Fallback (single-institute system)
//       if (!instituteId) {
//         console.log("⚠️ instituteId missing → using DEFAULT_INSTITUTE_ID");
//         instituteId = DEFAULT_INSTITUTE_ID;
//       }

//       /* ---------------- Fetch institute ---------------- */
//       console.log("STEP 2 Fetching institute with key =", instituteId);
//       console.log("INSTITUTES_TBL =", INSTITUTES_TBL);

//       const inst = await get(INSTITUTES_TBL, {
//         instituteld: instituteId, // ⚠️ exact PK spelling
//       });

//       console.log("STEP 3 Institute record =", JSON.stringify(inst, null, 2));

//       if (!inst) {
//         console.log("❌ Institute not found in DynamoDB");
//         return res.status(404).json({ message: "Unknown instituteId" });
//       }

//       /* ---------------- Cognito ---------------- */
//       console.log("STEP 4 Creating Cognito user", {
//         email,
//         name,
//         instituteId,
//       });

//       const { username } = await createUserAndAddToGroup({
//         email,
//         name,
//         group: "Student",
//         instituteId,
//       });

//       /* ---------------- Access object ---------------- */
//       const safeAccess = {
//         courses: Array.isArray(access?.courses) ? access.courses : [],
//         qbank: !!access?.qbank,
//         mocktest: !!access?.mocktest,
//         ebooks: !!access?.ebooks,
//       };

//       /* ---------------- Save user ---------------- */
//       const now = nowISO();

//       const userItem = {
//         sub: username,
//         email: email.toLowerCase(),
//         name,
//         role: "Student",
//         instituteId,
//         instituteName: inst.instituteName,
//         emailVerified: false,
//         access: safeAccess,
//         status: "active",
//         createdAt: now,
//         updatedAt: now,
//       };

//       console.log("STEP 5 Saving user to DDB =", JSON.stringify(userItem, null, 2));

//       await put(USERS_TABLE, userItem);

//       console.log("✅ STEP 6 Student created successfully");

//       return res.status(201).json({
//         message: "Student invited successfully",
//         user: userItem,
//       });
//     } catch (e) {
//       console.error("❌ ADMIN ADD STUDENT ERROR");
//       console.error("ERROR NAME:", e.name);
//       console.error("ERROR CODE:", e.code);
//       console.error("ERROR MESSAGE:", e.message);
//       console.error("FULL ERROR:", e);

//       if (e.code === "UsernameExistsException") {
//         return res.status(409).json({ message: "Email already in use" });
//       }

//       return res.status(500).json({ message: "Server error" });
//     }
//   }
// );

// module.exports = router;

// API/middleware/adminUsersRoute.js

const express = require("express");
const router = express.Router();

const { authAccess, requireRoles } = require("./auth");

/* ---------------- AWS SDK v3 ---------------- */
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} = require("@aws-sdk/lib-dynamodb");

const {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

/* ---------------- Config ---------------- */
const REGION =
  process.env.COGNITO_REGION ||
  process.env.AWS_REGION ||
  "ap-south-1";

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

// Tables (NO schema change)
const USERS_TABLE = process.env.DDB_USERS_TABLE || "EdzestUsers";
const INSTITUTES_TBL =
  process.env.DDB_INSTITUTES_TABLE || "EdzestInstitutes";

// ✅ Existing institute PK from DynamoDB
const DEFAULT_INSTITUTE_ID = "0z2w1ep"; // instituteld

/* ---------------- Clients ---------------- */
const ddbClient = new DynamoDBClient({ region: REGION });
const ddb = DynamoDBDocumentClient.from(ddbClient);

const cognito = new CognitoIdentityProviderClient({ region: REGION });

const nowISO = () => new Date().toISOString();

/* ---------------- Helpers ---------------- */
async function get(table, Key) {
  const r = await ddb.send(
    new GetCommand({
      TableName: table,
      Key,
    })
  );
  return r.Item;
}

async function put(table, Item) {
  await ddb.send(
    new PutCommand({
      TableName: table,
      Item,
    })
  );
}

/* ---------------- Cognito helper ---------------- */
async function createUserAndAddToGroup({
  email,
  name,
  group,
  instituteId,
}) {
  console.log("COGNITO → Creating user:", email);

  const createRes = await cognito.send(
    new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email.toLowerCase(),
      DesiredDeliveryMediums: ["EMAIL"],
      UserAttributes: [
        { Name: "email", Value: email.toLowerCase() },
        { Name: "name", Value: name },
        { Name: "email_verified", Value: "false" },
        ...(process.env.COGNITO_CUSTOM_INST_ATTR
          ? [
              {
                Name: process.env.COGNITO_CUSTOM_INST_ATTR,
                Value: instituteId,
              },
            ]
          : []),
      ],
    })
  );

  const username =
    createRes.User?.Username || email.toLowerCase();

  console.log("COGNITO → Adding user to group:", group);

  await cognito.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      GroupName: group,
    })
  );

  return { username };
}

/**
 * -------------------------------------------------------
 * POST /api/admin/users/students
 * -------------------------------------------------------
 */
router.post(
  "/students",
  authAccess,
  requireRoles(["admin", "superadmin"]),
  async (req, res) => {
    try {
      console.log("========== ADMIN ADD STUDENT ==========");
      console.log("REQ BODY =", JSON.stringify(req.body, null, 2));
      console.log("REQ USER =", JSON.stringify(req.user, null, 2));

      const { name, email, access } = req.body || {};

      if (!name || !email) {
        console.log("❌ Missing name or email");
        return res.status(400).json({ message: "Missing name/email" });
      }

      /* ---------------- Resolve instituteId ---------------- */
      let instituteId = req.user?.instituteId;

      console.log("STEP 1 instituteId from req.user =", instituteId);
      console.log("STEP 1 role =", req.user?.role);

      // ✅ Fallback (single-institute system)
      if (!instituteId) {
        console.log("⚠️ instituteId missing → using DEFAULT_INSTITUTE_ID");
        instituteId = DEFAULT_INSTITUTE_ID;
      }

      /* ---------------- Fetch institute ---------------- */
      console.log("STEP 2 Fetching institute with key =", instituteId);
      console.log("INSTITUTES_TBL =", INSTITUTES_TBL);

    const inst = await get(INSTITUTES_TBL, {
  instituteId: instituteId,
});

      console.log("STEP 3 Institute record =", JSON.stringify(inst, null, 2));

      if (!inst) {
        console.log("❌ Institute not found in DynamoDB");
        return res.status(404).json({ message: "Unknown instituteId" });
      }

      /* ---------------- Cognito ---------------- */
      console.log("STEP 4 Creating Cognito user", {
        email,
        name,
        instituteId,
      });

      const { username } = await createUserAndAddToGroup({
        email,
        name,
        group: "Student",
        instituteId,
      });

      /* ---------------- Access object ---------------- */
      const safeAccess = {
        courses: Array.isArray(access?.courses) ? access.courses : [],
        qbank: !!access?.qbank,
        mocktest: !!access?.mocktest,
        ebooks: !!access?.ebooks,
      };

      /* ---------------- Save user ---------------- */
      const now = nowISO();

      const userItem = {
        sub: username,
        email: email.toLowerCase(),
        name,
        role: "Student",
        instituteId,
        instituteName: inst.instituteName,
        emailVerified: false,
        access: safeAccess,
        status: "active",
        createdAt: now,
        updatedAt: now,
      };

      console.log("STEP 5 Saving user to DDB =", JSON.stringify(userItem, null, 2));

      await put(USERS_TABLE, userItem);

      console.log("✅ STEP 6 Student created successfully");

      return res.status(201).json({
        message: "Student invited successfully",
        user: userItem,
      });
    } catch (e) {



  // 🔵 USER ALREADY EXISTS (EXPECTED CASE)
  if (e.name === "UsernameExistsException") {
    // console.log("⚠️ User already exists:", email);
console.log("⚠️ User already exists:", req.body?.email);

    return res.status(409).json({
      code: "USER_ALREADY_EXISTS",
      message: "User already exists",
    });
  }

  // 🔴 REAL SERVER ERROR
  console.error("ADMIN ADD STUDENT ERROR:", e);

  return res.status(500).json({
    code: "INTERNAL_ERROR",
    message: "Something went wrong. Please try again.",
  });
}

  }
);

module.exports = router;
