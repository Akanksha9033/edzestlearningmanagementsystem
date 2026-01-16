// console.log("🔥 AdminAddUserRoute LOADED");

// const express = require("express");
// const router = express.Router();

// const bcrypt = require("bcryptjs");
// const crypto = require("crypto");

// const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
// const {
//   DynamoDBDocumentClient,
//   PutCommand,
//   ScanCommand,
// } = require("@aws-sdk/lib-dynamodb");

// const { authAccess, requireRoles } = require("../../middleware/auth");

// const REGION = process.env.AWS_REGION || "ap-south-1";
// const USERS_TABLE = process.env.DDB_USERS_TABLE;

// console.log("🔥 USERS_TABLE =", USERS_TABLE);

// // Dynamo client
// const ddbClient = new DynamoDBClient({ region: REGION });
// const ddb = DynamoDBDocumentClient.from(ddbClient);

// /* =========================================================
//    POST: CREATE LEARNER  (NO CHANGES DONE HERE)
//    ========================================================= */
// router.post(
//   "/admin/users",
//   authAccess,
//   requireRoles(["admin", "SuperAdmin"]),
//   async (req, res) => {
//     console.log("🔥 HIT /api/admin/users");
//     console.log("🔥 req.user =", req.user);
//     console.log("🔥 BODY =", req.body);

//     try {
//       const { email, name, password, product, accessType, expiry } = req.body;
      

//       if (!email || !name) {
//         return res.status(400).json({ message: "Email & name required" });
//       }

//       // ✅ SAME AS COGNITO USERS
//       const sub = crypto.randomUUID();
//       const now = new Date().toISOString();

//       let passwordHash = null;
//       if (password) {
//         passwordHash = await bcrypt.hash(password, 10);
//       }

//       const userItem = {
//         sub, // ✅ REQUIRED KEY (matches DynamoDB schema)
//         email: email.toLowerCase(),
//         name,
//         role: "student",
//         emailVerified: false,
//         passwordHash,

//         products: product
//           ? [{ productId: product, accessType, expiry }]
//           : [],

//         instituteId: null,
//         instituteName: "",
//         createdAt: now,
//         updatedAt: now,
//         createdBy: "ADMIN",
//       };

//       await ddb.send(
//         new PutCommand({
//           TableName: USERS_TABLE,
//           Item: userItem,
//         })
//       );

//       console.log("✅ LEARNER CREATED:", sub);

//       return res.json({ success: true, sub });
//     } catch (err) {
//       console.error("❌ Create learner failed");
//       console.error("❌ err.name =", err.name);
//       console.error("❌ err.message =", err.message);
//       console.error("❌ err.stack =", err.stack);

//       return res.status(500).json({ message: "Failed to create learner" });
//     }
//   }
// );

// /* =========================================================
//    GET: FETCH ALL LEARNERS (ADDED — REQUIRED FOR LIST PAGE)
//    ========================================================= */
// router.get(
//   "/admin/users",
//   authAccess,
//   requireRoles(["admin", "SuperAdmin"]),
//   async (req, res) => {
//     try {
//       console.log("🔥 HIT GET /api/admin/users");

//       const result = await ddb.send(
//         new ScanCommand({
//           TableName: USERS_TABLE,
//         })
//       );

//       const users = (result.Items || [])
//         .filter((u) => u.role === "student")
//         .map((u) => ({
//           sub: u.sub,
//           email: u.email,
//           name: u.name,
//           role: u.role,
//           createdAt: u.createdAt,
//         }));

//       return res.json({ users });
//     } catch (err) {
//       console.error("❌ Fetch learners failed");
//       console.error(err);
//       return res.status(500).json({ message: "Failed to fetch learners" });
//     }
//   }
// );

// module.exports = router;

// console.log("🔥 AdminAddUserRoute LOADED");

// const express = require("express");
// const router = express.Router();

// const bcrypt = require("bcryptjs");
// const crypto = require("crypto");

// /* ================= DYNAMODB ================= */
// const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
// const {
//   DynamoDBDocumentClient,
//   PutCommand,
//   ScanCommand,
// } = require("@aws-sdk/lib-dynamodb");

// const REGION = process.env.AWS_REGION || "ap-south-1";

// const ddb = DynamoDBDocumentClient.from(
//   new DynamoDBClient({ region: REGION })
// );

// const USERS_TABLE = process.env.DDB_USERS_TABLE;
// const ENROLLMENTS_TABLE = process.env.STUDENT_ENROLLMENTS_TABLE;

// console.log("🔥 USERS_TABLE =", USERS_TABLE);
// console.log("🔥 ENROLLMENTS_TABLE =", ENROLLMENTS_TABLE);

// /* ================= COGNITO ================= */
// const {
//   CognitoIdentityProviderClient,
//   AdminCreateUserCommand,
//   AdminSetUserPasswordCommand,
//   AdminUpdateUserAttributesCommand,
// } = require("@aws-sdk/client-cognito-identity-provider");

// const cognito = new CognitoIdentityProviderClient({
//   region: process.env.COGNITO_REGION || REGION,
// });

// console.log("🔥 COGNITO_REGION =", process.env.COGNITO_REGION || REGION); 
// console.log("🔥 COGNITO_USER_POOL_ID =", process.env.COGNITO_USER_POOL_ID);

// /* ================= AUTH ================= */
// const { authAccess, requireRoles } = require("../../middleware/auth");

// /* ================= HELPERS ================= */
// function normEmail(email) {
//   return String(email || "").trim().toLowerCase();
// }

// /* =========================================================
//    POST: CREATE LEARNER (ADMIN)
//    ========================================================= */
// router.post(
//   "/admin/users",
//   authAccess,
//   requireRoles(["admin", "SuperAdmin"]),
//   async (req, res) => {
//     console.log("🔥 HIT /api/admin/users");
//     console.log("🔥 req.user =", req.user);
//     console.log("🔥 BODY =", req.body);

//     try {
//       const { email, name, password, product, accessType, expiry } = req.body;

//       if (!email || !name) {
//         return res.status(400).json({ message: "Email & name required" });
//       }

//       const username = normEmail(email);
//       const now = new Date().toISOString();
//       const sub = crypto.randomUUID();

//       const isAdminPassword = !!(password && String(password).trim());

//       const passwordSetupToken = isAdminPassword
//         ? null
//         : crypto.randomBytes(32).toString("hex");

//       const passwordSetupExpiry = isAdminPassword
//         ? null
//         : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

//       let passwordHash = null;
//       if (password) {
//         passwordHash = await bcrypt.hash(password, 10);
//       }

//       /* ================= COGNITO CREATE USER ================= */
//       try {
//         await cognito.send(
//           new AdminCreateUserCommand({
//             UserPoolId: process.env.COGNITO_USER_POOL_ID,
//             Username: username,
//             TemporaryPassword: isAdminPassword ? String(password) : undefined,
//             UserAttributes: [
//               { Name: "email", Value: username },
//               { Name: "name", Value: name },
//               { Name: "email_verified", Value: "true" },
//             ],
//             MessageAction: "SUPPRESS",
//           })
//         );

//         console.log("✅ Cognito user created");
//       } catch (e) {
//         if (e?.name === "UsernameExistsException") {
//           console.log("ℹ️ User already exists in Cognito");
//         } else {
//           throw e;
//         }
//       }

//       /* ================= UPDATE ATTRIBUTES ================= */
//       try {
//         await cognito.send(
//           new AdminUpdateUserAttributesCommand({
//             UserPoolId: process.env.COGNITO_USER_POOL_ID,
//             Username: username,
//             UserAttributes: [
//               { Name: "email", Value: username },
//               { Name: "name", Value: name },
//               { Name: "email_verified", Value: "true" },
//             ],
//           })
//         );
//       } catch (e) {
//         console.log("⚠️ AdminUpdateUserAttributes ignored");
//       }

//       /* ================= SET PASSWORD ================= */
//       if (isAdminPassword) {
//         await cognito.send(
//           new AdminSetUserPasswordCommand({
//             UserPoolId: process.env.COGNITO_USER_POOL_ID,
//             Username: username,
//             Password: String(password),
//             Permanent: true,
//           })
//         );

//         console.log("✅ Cognito password set");
//       }

//       /* ================= SAVE USER (DDB) ================= */
//       const userItem = {
//         sub,
//         email: username,
//         name,
//         role: "student",
//         emailVerified: false,
//         passwordHash,
//         passwordSetByAdmin: isAdminPassword,
//         passwordSetupToken,
//         passwordSetupExpiry,
//         products: product
//           ? [{ productId: product, accessType, expiry }]
//           : [],
//         instituteId: null,
//         instituteName: "",
//         createdAt: now,
//         updatedAt: now,
//         createdBy: "ADMIN",
//       };

//       await ddb.send(
//         new PutCommand({
//           TableName: USERS_TABLE,
//           Item: userItem,
//         })
//       );

//       console.log("✅ User saved in USERS_TABLE");

//       /* ================= CREATE ENROLLMENT (NEW) ================= */
//       try {
//         if (ENROLLMENTS_TABLE && product) {
//           await ddb.send(
//             new PutCommand({
//               TableName: ENROLLMENTS_TABLE,
//               Item: {
//                 pk: `USER#${sub}`,
//                 sk: `ENROLLMENT#${product}`,
//                 productType: product,
//                 accessType: accessType || "admin",
//                 expiry: expiry || null,
//                 assignedBy: req.user?.email || "admin",
//                 createdAt: now,
//               },
//             })
//           );

//           console.log("✅ Enrollment created");
//         }
//       } catch (e) {
//         console.error("❌ Enrollment creation failed", e);
//       }

//       return res.json({ success: true, sub });
//     } catch (err) {
//       console.error("❌ CREATE LEARNER FAILED");
//       console.error(err);
//       return res.status(500).json({ message: "Failed to create learner" });
//     }
//   }
// );

// /* =========================================================
//    GET: FETCH ALL LEARNERS
//    ========================================================= */
// router.get(
//   "/admin/users",
//   authAccess,
//   requireRoles(["admin", "SuperAdmin"]),
//   async (req, res) => {
//     try {
//       const result = await ddb.send(
//         new ScanCommand({
//           TableName: USERS_TABLE,
//         })
//       );

//       const users = (result.Items || [])
//         .filter((u) => String(u.role).toLowerCase() === "student")
//         .map((u) => ({
//           sub: u.sub,
//           email: u.email,
//           name: u.name,
//           role: u.role,
//           emailVerified: u.emailVerified,
//           createdAt: u.createdAt,
//         }));

//       return res.json({ users });
//     } catch (err) {
//       console.error("❌ Fetch learners failed", err);
//       return res.status(500).json({ message: "Failed to fetch learners" });
//     }
//   }
// );

// /* =========================================================
//    GET: SINGLE LEARNER BY SUB
//    ========================================================= */
// router.get(
//   "/admin/users/:sub",
//   authAccess,
//   requireRoles(["admin", "SuperAdmin"]),
//   async (req, res) => {
//     try {
//       const { sub } = req.params;

//       const result = await ddb.send(
//         new ScanCommand({
//           TableName: USERS_TABLE,
//           FilterExpression: "#s = :sub",
//           ExpressionAttributeNames: { "#s": "sub" },
//           ExpressionAttributeValues: { ":sub": sub },
//         })
//       );

//       if (!result.Items || result.Items.length === 0) {
//         return res.status(404).json({ message: "Learner not found" });
//       }

//       return res.json({ user: result.Items[0] });
//     } catch (err) {
//       console.error("❌ Fetch learner failed", err);
//       return res.status(500).json({ message: "Server error" });
//     }
//   }
// );

// module.exports = router;

console.log("🔥 AdminAddUserRoute LOADED");

const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const crypto = require("crypto");

/* ================= DYNAMODB ================= */
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");

const REGION = process.env.AWS_REGION || "ap-south-1";

const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: REGION })
);

const USERS_TABLE = process.env.DDB_USERS_TABLE;
const ENROLLMENTS_TABLE = process.env.STUDENT_ENROLLMENTS_TABLE;

console.log("🔥 USERS_TABLE =", USERS_TABLE);
console.log("🔥 ENROLLMENTS_TABLE =", ENROLLMENTS_TABLE);

/* ================= COGNITO ================= */
const {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand,
  AdminGetUserCommand, // ✅ IMPORTANT
  AdminDeleteUserCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const cognito = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION || REGION,
});

console.log("🔥 COGNITO_REGION =", process.env.COGNITO_REGION || REGION);
console.log("🔥 COGNITO_USER_POOL_ID =", process.env.COGNITO_USER_POOL_ID);

/* ================= AUTH ================= */
const { authAccess, requireRoles } = require("../../middleware/auth");

/* ================= HELPERS ================= */
function normEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/* =========================================================
   POST: CREATE LEARNER (ADMIN)
   ========================================================= */
router.post(
  "/admin/users",
  authAccess,
  requireRoles(["admin", "SuperAdmin"]),
  async (req, res) => {
    console.log("🔥 HIT /api/admin/users");
    console.log("🔥 req.user =", req.user);
    console.log("🔥 BODY =", req.body);

    


    try {
      const { email, name, password, product, productType, accessType, expiry } =
        req.body;

      if (!email || !name) {
        return res.status(400).json({ message: "Email & name required" });
      }

      const username = normEmail(email);
      const now = new Date().toISOString();

      const isAdminPassword = !!(password && String(password).trim());

      const passwordSetupToken = isAdminPassword
        ? null
        : crypto.randomBytes(32).toString("hex");

      const passwordSetupExpiry = isAdminPassword
        ? null
        : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

      let passwordHash = null;
      if (password) {
        passwordHash = await bcrypt.hash(password, 10);
      }

      /* ================= COGNITO CREATE USER ================= */
      try {
        await cognito.send(
          new AdminCreateUserCommand({
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            Username: username,
            TemporaryPassword: isAdminPassword ? String(password) : undefined,
            UserAttributes: [
              { Name: "email", Value: username },
              { Name: "name", Value: name },
              { Name: "email_verified", Value: "true" },
            ],
            MessageAction: "SUPPRESS",
          })
        );
        console.log("✅ Cognito user created");
      } catch (e) {
        if (e?.name === "UsernameExistsException") {
          console.log("ℹ️ User already exists in Cognito");
        } else {
          throw e;
        }
      }

      /* ================= UPDATE ATTRIBUTES ================= */
      try {
        await cognito.send(
          new AdminUpdateUserAttributesCommand({
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            Username: username,
            UserAttributes: [
              { Name: "email", Value: username },
              { Name: "name", Value: name },
              { Name: "email_verified", Value: "true" },
            ],
          })
        );
      } catch {
        console.log("⚠️ AdminUpdateUserAttributes ignored");
      }

      /* ================= SET PASSWORD ================= */
      if (isAdminPassword) {
        await cognito.send(
          new AdminSetUserPasswordCommand({
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            Username: username,
            Password: String(password),
            Permanent: true,
          })
        );
        console.log("✅ Cognito password set");
      }

      /* ================= 🔥 FETCH REAL COGNITO SUB ================= */
      let cognitoSub = null;

      try {
        const userRes = await cognito.send(
          new AdminGetUserCommand({
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            Username: username,
          })
        );

        const subAttr = userRes.UserAttributes.find(
          (a) => a.Name === "sub"
        );
        cognitoSub = subAttr?.Value;
      } catch (e) {
        console.error("❌ Failed to fetch Cognito sub", e);
      }

      if (!cognitoSub) {
        return res.status(500).json({ message: "Cognito sub not found" });
      }

      console.log("✅ Cognito SUB =", cognitoSub);

      const sub = cognitoSub; // 🔥 SINGLE SOURCE OF TRUTH

      /* ================= SAVE USER (DDB) ================= */
      const userItem = {
        sub,
        email: username,
        name,
        role: "student",
        emailVerified: false,
        passwordHash,
        passwordSetByAdmin: isAdminPassword,
        passwordSetupToken,
        passwordSetupExpiry,
        products: product
          ? [{ productId: product, accessType, expiry }]
          : [],
        instituteId: null,
        instituteName: "",
        createdAt: now,
        updatedAt: now,
        createdBy: "ADMIN",
      };

      await ddb.send(
        new PutCommand({
          TableName: USERS_TABLE,
          Item: userItem,
        })
      );

      console.log("✅ User saved in USERS_TABLE");

      /* ================= CREATE ENROLLMENT ================= */
      if (ENROLLMENTS_TABLE && product) {
        await ddb.send(
          new PutCommand({
            TableName: ENROLLMENTS_TABLE,
            Item: {
              pk: `USER#${sub}`,
              sk: `ENROLLMENT#${product}`,
              productId: product,
              productType: String(productType || "MOCKTEST").toUpperCase(),
              accessSource: "admin",
              status: "ACTIVE",
              expiry: expiry || null,
              assignedBy: req.user?.email || "admin",
              createdAt: now,
            },
          })
        );
        console.log("✅ Enrollment created");
      }

      return res.json({ success: true, sub });
    } catch (err) {
      console.error("❌ CREATE LEARNER FAILED", err);
      return res.status(500).json({ message: "Failed to create learner" });
    }
  }
);


/* =========================================================
   DELETE: LEARNER (ADMIN)
   ========================================================= */
router.delete(
  "/admin/users/:sub",
  authAccess,
  requireRoles(["admin", "SuperAdmin"]),
  async (req, res) => {
    console.log("🔥 DELETE USER HIT", req.params.sub);

    try {
      const { sub } = req.params;

      // 1️⃣ Find user first (to get email for Cognito)
      const result = await ddb.send(
        new ScanCommand({
          TableName: USERS_TABLE,
          FilterExpression: "#s = :sub",
          ExpressionAttributeNames: { "#s": "sub" },
          ExpressionAttributeValues: { ":sub": sub },
        })
      );

      if (!result.Items || result.Items.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = result.Items[0];

      // 2️⃣ Delete from Cognito (USERNAME = EMAIL)
      try {
        await cognito.send(
          new AdminDeleteUserCommand({
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            Username: user.email, // ⚠️ IMPORTANT
          })
        );
        console.log("✅ Cognito user deleted");
      } catch (err) {
        console.log("⚠️ Cognito delete skipped", err.message);
      }

      // 3️⃣ Delete from DynamoDB
      await ddb.send(
        new DeleteCommand({
          TableName: USERS_TABLE,
          Key: { sub },
        })
      );

      console.log("✅ User deleted from USERS_TABLE");

      return res.json({ success: true });
    } catch (err) {
      console.error("❌ Delete user failed", err);
      return res.status(500).json({ message: "Failed to delete user" });
    }
  }
);

/* =========================================================
   GET: FETCH ALL LEARNERS
   ========================================================= */
router.get(
  "/admin/users",
  authAccess,
  requireRoles(["admin", "SuperAdmin"]),
  async (_req, res) => {
    try {
      const result = await ddb.send(
        new ScanCommand({ TableName: USERS_TABLE })
      );

      const users = (result.Items || [])
        .filter((u) => String(u.role).toLowerCase() === "student")
        .map((u) => ({
          sub: u.sub,
          email: u.email,
          name: u.name,
          role: u.role,
          emailVerified: u.emailVerified,
          createdAt: u.createdAt,
        }));

      return res.json({ users });
    } catch (err) {
      console.error("❌ Fetch learners failed", err);
      return res.status(500).json({ message: "Failed to fetch learners" });
    }
  }
);

/* =========================================================
   POST: BULK DELETE LEARNERS (ADMIN)
   ========================================================= */
router.post(
  "/admin/users/bulk-delete",
  authAccess,
  requireRoles(["admin", "SuperAdmin"]),
  async (req, res) => {
    console.log("🔥 BULK DELETE HIT");
    console.log("🔥 BODY =", req.body);

    try {
      const { subs } = req.body;

      if (!Array.isArray(subs) || subs.length === 0) {
        return res.status(400).json({ message: "Invalid subs array" });
      }

      for (const sub of subs) {
        try {
          /* ===== Delete from Cognito ===== */
          await cognito.send(
            new AdminDeleteUserCommand({
              UserPoolId: process.env.COGNITO_USER_POOL_ID,
              Username: sub,
            })
          );

          /* ===== Delete from DynamoDB ===== */
          await ddb.send(
            new DeleteCommand({
              TableName: USERS_TABLE,
              Key: { sub },
            })
          );

          console.log("✅ Deleted user:", sub);
        } catch (err) {
          console.error("❌ Failed deleting user:", sub, err.message);
        }
      }

      return res.json({ success: true });
    } catch (err) {
      console.error("❌ BULK DELETE FAILED", err);
      return res.status(500).json({ message: "Bulk delete failed" });
    }
  }
);

/* =========================================================
   POST: BULK CREATE LEARNERS (ADMIN - EXCEL UPLOAD)
   ========================================================= */
router.post(
  "/admin/users/bulk-create",
  authAccess,
  requireRoles(["admin", "SuperAdmin"]),
  async (req, res) => {
    console.log("🔥 HIT /api/admin/users/bulk-create");
    console.log("🔥 BODY =", req.body);

    try {
      const { users } = req.body;

      if (!Array.isArray(users)) {
        return res.status(400).json({ message: "Invalid users array" });
      }

      const now = new Date().toISOString();

      let created = 0;
      let skipped = 0;
      let errors = [];

      for (const u of users) {
        try {
          if (!u.email || !u.name) {
            skipped++;
            continue;
          }

          const username = normEmail(u.email);
          const name = String(u.name).trim();
          const password = u.password ? String(u.password).trim() : null;

          const isAdminPassword = !!password;

          const passwordSetupToken = isAdminPassword
            ? null
            : crypto.randomBytes(32).toString("hex");

          const passwordSetupExpiry = isAdminPassword
            ? null
            : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

          let passwordHash = null;
          if (password) {
            passwordHash = await bcrypt.hash(password, 10);
          }

          /* ============ COGNITO CREATE ============ */
          try {
            await cognito.send(
              new AdminCreateUserCommand({
                UserPoolId: process.env.COGNITO_USER_POOL_ID,
                Username: username,
                TemporaryPassword: isAdminPassword ? password : undefined,
                UserAttributes: [
                  { Name: "email", Value: username },
                  { Name: "name", Value: name },
                  { Name: "email_verified", Value: "true" },
                ],
                MessageAction: "SUPPRESS",
              })
            );
            console.log("✅ Cognito user created:", username);
          } catch (e) {
            if (e?.name === "UsernameExistsException") {
              console.log("ℹ️ Cognito user already exists:", username);
            } else {
              throw e;
            }
          }

          /* ============ SET PASSWORD ============ */
          if (isAdminPassword) {
            await cognito.send(
              new AdminSetUserPasswordCommand({
                UserPoolId: process.env.COGNITO_USER_POOL_ID,
                Username: username,
                Password: password,
                Permanent: true,
              })
            );
          }

          /* ============ GET COGNITO SUB ============ */
          const userRes = await cognito.send(
            new AdminGetUserCommand({
              UserPoolId: process.env.COGNITO_USER_POOL_ID,
              Username: username,
            })
          );

          const subAttr = userRes.UserAttributes.find(
            (a) => a.Name === "sub"
          );

          if (!subAttr?.Value) {
            skipped++;
            continue;
          }

          const sub = subAttr.Value;

          /* ============ SAVE USER IN DDB ============ */
          await ddb.send(
            new PutCommand({
              TableName: USERS_TABLE,
              Item: {
                sub,
                email: username,
                name,
                role: "student",
                emailVerified: false,
                passwordHash,
                passwordSetByAdmin: isAdminPassword,
                passwordSetupToken,
                passwordSetupExpiry,
                products: [],
                instituteId: null,
                instituteName: "",
                createdAt: now,
                updatedAt: now,
                createdBy: "ADMIN_BULK",
              },
            })
          );

          created++;
        } catch (err) {
          console.error("❌ Failed user:", u.email, err);
          errors.push({
            email: u.email,
            message: err.message,
          });
        }
      }

      return res.json({
        success: true,
        created,
        skipped,
        errors,
      });
    } catch (err) {
      console.error("❌ BULK CREATE FAILED", err);
      return res.status(500).json({ message: "Bulk create failed" });
    }
  }
);

/* =========================================================
   GET: SINGLE LEARNER BY SUB
   ========================================================= */
router.get(
  "/admin/users/:sub",
  authAccess,
  requireRoles(["admin", "SuperAdmin"]),
  async (req, res) => {
    try {
      const { sub } = req.params;

      const result = await ddb.send(
        new ScanCommand({
          TableName: USERS_TABLE,
          FilterExpression: "#s = :sub",
          ExpressionAttributeNames: { "#s": "sub" },
          ExpressionAttributeValues: { ":sub": sub },
        })
      );

      if (!result.Items || result.Items.length === 0) {
        return res.status(404).json({ message: "Learner not found" });
      }

      return res.json({ user: result.Items[0] });
    } catch (err) {
      console.error("❌ Fetch learner failed", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
