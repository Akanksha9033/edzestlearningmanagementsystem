
//   //  sdk v3 version

//   /****************************************************
//  *  adminRoute.js  —  FULL AWS SDK v3 MIGRATION
//  ****************************************************/

// const express = require("express");
// const router = express.Router();
// const crypto = require("crypto");
// const { authAccess, requireRoles } = require("./auth");

// const {
//   DynamoDBClient,
// } = require("@aws-sdk/client-dynamodb");

// const {
//   DynamoDBDocumentClient,
//   GetCommand,
//   PutCommand,
//   ScanCommand,
// } = require("@aws-sdk/lib-dynamodb");

// const {
//   CognitoIdentityProviderClient,
//   AdminCreateUserCommand,
//   AdminAddUserToGroupCommand,
//   AdminSetUserPasswordCommand,
//   AdminUserGlobalSignOutCommand,
// } = require("@aws-sdk/client-cognito-identity-provider");

// const REGION = process.env.COGNITO_REGION || process.env.AWS_REGION || "ap-south-1";
// const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
// const USERS_TABLE = process.env.DDB_USERS_TABLE || "EdzestUsers";
// const INSTITUTES_TBL = process.env.DDB_INSTITUTES_TABLE || "EdzestInstitutes";

// const ddbClient = new DynamoDBClient({ region: REGION });
// const ddb = DynamoDBDocumentClient.from(ddbClient);

// const cognito = new CognitoIdentityProviderClient({ region: REGION });

// const nowISO = () => new Date().toISOString();
// const rand8 = () =>
//   crypto.randomBytes(6).toString("base64").replace(/[^a-z0-9]/gi, "").slice(0, 8);

// /* ---------------- DDB HELPERS ---------------- */

// async function put(table, Item) {
//   await ddb.send(new PutCommand({ TableName: table, Item }));
// }

// async function get(table, Key) {
//   const r = await ddb.send(new GetCommand({ TableName: table, Key }));
//   return r.Item;
// }

// async function queryByInstituteRole(instituteId, role) {
//   const r = await ddb.send(
//     new ScanCommand({
//       TableName: USERS_TABLE,
//       FilterExpression: "#i = :i AND #r = :r",
//       ExpressionAttributeNames: { "#i": "instituteId", "#r": "role" },
//       ExpressionAttributeValues: { ":i": instituteId, ":r": role },
//     })
//   );
//   return r.Items || [];
// }

// /* ---------------- COGNITO HELPERS ---------------- */

// async function createUserAndAddToGroup({ email, name, group, instituteId }) {
//   const cu = await cognito.send(
//     new AdminCreateUserCommand({
//       UserPoolId: USER_POOL_ID,
//       Username: email.toLowerCase(),
//       DesiredDeliveryMediums: ["EMAIL"],
//       UserAttributes: [
//         { Name: "email", Value: email.toLowerCase() },
//         { Name: "name", Value: name },
//         { Name: "email_verified", Value: "false" },
//         ...(process.env.COGNITO_CUSTOM_INST_ATTR
//           ? [{ Name: process.env.COGNITO_CUSTOM_INST_ATTR, Value: instituteId }]
//           : []),
//       ],
//     })
//   );

//   const username = cu.User?.Username || email.toLowerCase();

//   await cognito.send(
//     new AdminAddUserToGroupCommand({
//       UserPoolId: USER_POOL_ID,
//       Username: username,
//       GroupName: group,
//     })
//   );

//   return { username };
// }

// /***********************
//  *     SUPER ADMIN
//  ***********************/

// router.post(
//   "/superadmin/institutes",
//   authAccess,
//   requireRoles(["SuperAdmin"]),
//   async (req, res) => {
//     try {
//       let { instituteId, instituteName } = req.body || {};
//       if (!instituteName)
//         return res.status(400).json({ message: "instituteName required" });

//       instituteId = (instituteId || rand8()).toLowerCase();
//       const now = nowISO();

//       await put(INSTITUTES_TBL, {
//         instituteId,
//         instituteName,
//         createdAt: now,
//         updatedAt: now,
//       });

//       res.status(201).json({ instituteId, instituteName });
//     } catch (e) {
//       console.error(e);
//       res.status(500).json({ message: "Server error" });
//     }
//   }
// );

// router.get(
//   "/superadmin/institutes",
//   authAccess,
//   requireRoles(["SuperAdmin"]),
//   async (_req, res) => {
//     const r = await ddb.send(new ScanCommand({ TableName: INSTITUTES_TBL }));
//     res.json({ items: r.Items || [] });
//   }
// );

// /***********************
//  *   SUPER ADMIN → ADMINS
//  ***********************/

// router.post(
//   "/superadmin/admins",
//   authAccess,
//   requireRoles(["SuperAdmin"]),
//   async (req, res) => {
//     try {
//       const { name, email, instituteId } = req.body || {};
//       if (!name || !email || !instituteId)
//         return res.status(400).json({ message: "Missing fields" });

//       const inst = await get(INSTITUTES_TBL, { instituteId });
//       if (!inst)
//         return res.status(404).json({ message: "Unknown instituteId" });

//       const { username } = await createUserAndAddToGroup({
//         email,
//         name,
//         group: "Admin",
//         instituteId,
//       });

//       const now = nowISO();
//       const user = {
//         sub: username,
//         email: email.toLowerCase(),
//         name,
//         role: "Admin",
//         instituteId,
//         instituteName: inst.instituteName,
//         emailVerified: false,
//         createdAt: now,
//         updatedAt: now,
//       };

//       await put(USERS_TABLE, user);
//       res.status(201).json({ message: "Admin invited", user });
//     } catch (e) {
//       if (e.code === "UsernameExistsException")
//         return res.status(409).json({ message: "Email already in use" });
//       console.error(e);
//       res.status(500).json({ message: "Server error" });
//     }
//   }
// );

// router.get(
//   "/superadmin/admins",
//   authAccess,
//   requireRoles(["SuperAdmin"]),
//   async (req, res) => {
//     const { instituteId } = req.query || {};
//     if (!instituteId)
//       return res.status(400).json({ message: "instituteId required" });

//     const items = await queryByInstituteRole(instituteId, "Admin");
//     res.json({ items });
//   }
// );

// router.post(
//   "/superadmin/admins/reset-password",
//   authAccess,
//   requireRoles(["SuperAdmin"]),
//   async (req, res) => {
//     try {
//       const { email, newPassword, signOutAll } = req.body || {};
//       if (!email || !newPassword)
//         return res.status(400).json({ message: "Missing fields" });

//       await cognito.send(
//         new AdminSetUserPasswordCommand({
//           UserPoolId: USER_POOL_ID,
//           Username: email.toLowerCase(),
//           Password: newPassword,
//           Permanent: true,
//         })
//       );

//       if (signOutAll) {
//         await cognito.send(
//           new AdminUserGlobalSignOutCommand({
//             UserPoolId: USER_POOL_ID,
//             Username: email.toLowerCase(),
//           })
//         );
//       }

//       res.json({ message: "Password reset" });
//     } catch (e) {
//       console.error(e);
//       res.status(500).json({ message: "Server error" });
//     }
//   }
// );

// /***********************
//  *    ADMIN → TEACHERS
//  ***********************/

// router.post(
//   "/admin/teachers",
//   authAccess,
//   requireRoles(["Admin", "SuperAdmin"]),
//   async (req, res) => {
//     try {
//       const { name, email, instituteId: bodyInst } = req.body || {};
//       if (!name || !email)
//         return res.status(400).json({ message: "Missing fields" });

//       const instituteId =
//         req.user.role === "SuperAdmin"
//           ? bodyInst || req.user.instituteId
//           : req.user.instituteId;

//       if (!instituteId)
//         return res
//           .status(400)
//           .json({ message: "Admin profile missing instituteId" });

//       const inst = await get(INSTITUTES_TBL, { instituteId });
//       if (!inst) return res.status(404).json({ message: "Unknown instituteId" });

//       const { username } = await createUserAndAddToGroup({
//         email,
//         name,
//         group: "Teacher",
//         instituteId,
//       });

//       const now = nowISO();
//       const user = {
//         sub: username,
//         email: email.toLowerCase(),
//         name,
//         role: "Teacher",
//         instituteId,
//         instituteName: inst.instituteName,
//         emailVerified: false,
//         createdAt: now,
//         updatedAt: now,
//       };

//       await put(USERS_TABLE, user);
//       res.status(201).json({ message: "Teacher invited", user });
//     } catch (e) {
//       if (e.code === "UsernameExistsException")
//         return res.status(409).json({ message: "Email already in use" });
//       console.error(e);
//       res.status(500).json({ message: "Server error" });
//     }
//   }
// );

// router.get(
//   "/admin/teachers",
//   authAccess,
//   requireRoles(["Admin", "SuperAdmin"]),
//   async (req, res) => {
//     const instituteId =
//       req.user.role === "SuperAdmin"
//         ? req.query.instituteId || req.user.instituteId
//         : req.user.instituteId;

//     if (!instituteId)
//       return res.status(400).json({ message: "Missing instituteId" });

//     const items = await queryByInstituteRole(instituteId, "Teacher");
//     res.json({ items });
//   }
// );

// router.post(
//   "/admin/teachers/reset-password",
//   authAccess,
//   requireRoles(["Admin", "SuperAdmin"]),
//   async (req, res) => {
//     try {
//       const { email, newPassword, signOutAll } = req.body || {};
//       if (!email || !newPassword)
//         return res.status(400).json({ message: "Missing fields" });

//       /* Scan for teacher record */
//       const result = await ddb.send(
//         new ScanCommand({
//           TableName: USERS_TABLE,
//           FilterExpression: "#e = :e",
//           ExpressionAttributeNames: { "#e": "email" },
//           ExpressionAttributeValues: { ":e": email.toLowerCase() },
//         })
//       );

//       const prof = (result.Items || [])[0];

//       if (req.user.role !== "SuperAdmin") {
//         if (
//           !prof ||
//           prof.instituteId !== req.user.instituteId ||
//           prof.role !== "Teacher"
//         ) {
//           return res.status(403).json({ message: "Forbidden" });
//         }
//       }

//       await cognito.send(
//         new AdminSetUserPasswordCommand({
//           UserPoolId: USER_POOL_ID,
//           Username: email.toLowerCase(),
//           Password: newPassword,
//           Permanent: true,
//         })
//       );

//       if (signOutAll) {
//         await cognito.send(
//           new AdminUserGlobalSignOutCommand({
//             UserPoolId: USER_POOL_ID,
//             Username: email.toLowerCase(),
//           })
//         );
//       }

//       res.json({ message: "Password reset" });
//     } catch (e) {
//       console.error(e);
//       res.status(500).json({ message: "Server error" });
//     }
//   }
// );

// module.exports = router;



  //  sdk v3 version

  /****************************************************
 *  adminRoute.js  —  FULL AWS SDK v3 MIGRATION
 ****************************************************/

const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { authAccess, requireRoles } = require("./auth");

const {
  DynamoDBClient,
} = require("@aws-sdk/client-dynamodb");

const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");

const {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
  AdminSetUserPasswordCommand,
  AdminUserGlobalSignOutCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const REGION = process.env.COGNITO_REGION || process.env.AWS_REGION || "ap-south-1";
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const USERS_TABLE = process.env.DDB_USERS_TABLE || "EdzestUsers";
const INSTITUTES_TBL = process.env.DDB_INSTITUTES_TABLE || "EdzestInstitutes";

const ddbClient = new DynamoDBClient({ region: REGION });
const ddb = DynamoDBDocumentClient.from(ddbClient);

const cognito = new CognitoIdentityProviderClient({ region: REGION });

const nowISO = () => new Date().toISOString();
const rand8 = () =>
  crypto.randomBytes(6).toString("base64").replace(/[^a-z0-9]/gi, "").slice(0, 8);

/* ---------------- DDB HELPERS ---------------- */

async function put(table, Item) {
  await ddb.send(new PutCommand({ TableName: table, Item }));
}

async function get(table, Key) {
  const r = await ddb.send(new GetCommand({ TableName: table, Key }));
  return r.Item;
}

async function queryByInstituteRole(instituteId, role) {
  const r = await ddb.send(
    new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: "#i = :i AND #r = :r",
      ExpressionAttributeNames: { "#i": "instituteId", "#r": "role" },
      ExpressionAttributeValues: { ":i": instituteId, ":r": role },
    })
  );
  return r.Items || [];
}

/* ---------------- COGNITO HELPERS ---------------- */

async function createUserAndAddToGroup({ email, name, group, instituteId }) {
  const cu = await cognito.send(
    new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email.toLowerCase(),
      DesiredDeliveryMediums: ["EMAIL"],
      UserAttributes: [
        { Name: "email", Value: email.toLowerCase() },
        { Name: "name", Value: name },
        { Name: "email_verified", Value: "false" },
        ...(process.env.COGNITO_CUSTOM_INST_ATTR
          ? [{ Name: process.env.COGNITO_CUSTOM_INST_ATTR, Value: instituteId }]
          : []),
      ],
    })
  );

  const username = cu.User?.Username || email.toLowerCase();

  await cognito.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      GroupName: group,
    })
  );

  return { username };
}

/***********************
 *     SUPER ADMIN
 ***********************/

router.post(
  "/superadmin/institutes",
  authAccess,
  requireRoles(["SuperAdmin"]),
  async (req, res) => {
    try {
      let { instituteId, instituteName } = req.body || {};
      if (!instituteName)
        return res.status(400).json({ message: "instituteName required" });

      instituteId = (instituteId || rand8()).toLowerCase();
      const now = nowISO();

      await put(INSTITUTES_TBL, {
        instituteId,
        instituteName,
        createdAt: now,
        updatedAt: now,
      });

      res.status(201).json({ instituteId, instituteName });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.get(
  "/superadmin/institutes",
  authAccess,
  requireRoles(["SuperAdmin"]),
  async (_req, res) => {
    const r = await ddb.send(new ScanCommand({ TableName: INSTITUTES_TBL }));
    res.json({ items: r.Items || [] });
  }
);

/***********************
 *   SUPER ADMIN → ADMINS
 ***********************/

router.post(
  "/superadmin/admins",
  authAccess,
  requireRoles(["SuperAdmin"]),
  async (req, res) => {
    try {
      const { name, email, instituteId } = req.body || {};
      if (!name || !email || !instituteId)
        return res.status(400).json({ message: "Missing fields" });

      const inst = await get(INSTITUTES_TBL, { instituteId });
      if (!inst)
        return res.status(404).json({ message: "Unknown instituteId" });

      const { username } = await createUserAndAddToGroup({
        email,
        name,
        group: "Admin",
        instituteId,
      });

      const now = nowISO();
      const user = {
        sub: username,
        email: email.toLowerCase(),
        name,
        role: "Admin",
        instituteId,
        instituteName: inst.instituteName,
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
      };

      await put(USERS_TABLE, user);
      res.status(201).json({ message: "Admin invited", user });
    } catch (e) {
      if (e.code === "UsernameExistsException")
        return res.status(409).json({ message: "Email already in use" });
      console.error(e);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.get(
  "/superadmin/admins",
  authAccess,
  requireRoles(["SuperAdmin"]),
  async (req, res) => {
    const { instituteId } = req.query || {};
    if (!instituteId)
      return res.status(400).json({ message: "instituteId required" });

    const items = await queryByInstituteRole(instituteId, "Admin");
    res.json({ items });
  }
);

router.post(
  "/superadmin/admins/reset-password",
  authAccess,
  requireRoles(["SuperAdmin"]),
  async (req, res) => {
    try {
      const { email, newPassword, signOutAll } = req.body || {};
      if (!email || !newPassword)
        return res.status(400).json({ message: "Missing fields" });

      await cognito.send(
        new AdminSetUserPasswordCommand({
          UserPoolId: USER_POOL_ID,
          Username: email.toLowerCase(),
          Password: newPassword,
          Permanent: true,
        })
      );

      if (signOutAll) {
        await cognito.send(
          new AdminUserGlobalSignOutCommand({
            UserPoolId: USER_POOL_ID,
            Username: email.toLowerCase(),
          })
        );
      }

      res.json({ message: "Password reset" });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/***********************
 *    ADMIN → TEACHERS
 ***********************/

router.post(
  "/admin/teachers",
  authAccess,
  requireRoles(["Admin", "SuperAdmin"]),
  async (req, res) => {
    try {
      const { name, email, instituteId: bodyInst } = req.body || {};
      if (!name || !email)
        return res.status(400).json({ message: "Missing fields" });

      const instituteId =
        req.user.role === "SuperAdmin"
          ? bodyInst || req.user.instituteId
          : req.user.instituteId;

      if (!instituteId)
        return res
          .status(400)
          .json({ message: "Admin profile missing instituteId" });

      const inst = await get(INSTITUTES_TBL, { instituteId });
      if (!inst) return res.status(404).json({ message: "Unknown instituteId" });

      const { username } = await createUserAndAddToGroup({
        email,
        name,
        group: "Teacher",
        instituteId,
      });

      const now = nowISO();
      const user = {
        sub: username,
        email: email.toLowerCase(),
        name,
        role: "Teacher",
        instituteId,
        instituteName: inst.instituteName,
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
      };

      await put(USERS_TABLE, user);
      res.status(201).json({ message: "Teacher invited", user });
    } catch (e) {
      if (e.code === "UsernameExistsException")
        return res.status(409).json({ message: "Email already in use" });
      console.error(e);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.get(
  "/admin/teachers",
  authAccess,
  requireRoles(["Admin", "SuperAdmin"]),
  async (req, res) => {
    const instituteId =
      req.user.role === "SuperAdmin"
        ? req.query.instituteId || req.user.instituteId
        : req.user.instituteId;

    if (!instituteId)
      return res.status(400).json({ message: "Missing instituteId" });

    const items = await queryByInstituteRole(instituteId, "Teacher");
    res.json({ items });
  }
);

router.post(
  "/admin/teachers/reset-password",
  authAccess,
  requireRoles(["Admin", "SuperAdmin"]),
  async (req, res) => {
    try {
      const { email, newPassword, signOutAll } = req.body || {};
      if (!email || !newPassword)
        return res.status(400).json({ message: "Missing fields" });

      /* Scan for teacher record */
      const result = await ddb.send(
        new ScanCommand({
          TableName: USERS_TABLE,
          FilterExpression: "#e = :e",
          ExpressionAttributeNames: { "#e": "email" },
          ExpressionAttributeValues: { ":e": email.toLowerCase() },
        })
      );

      const prof = (result.Items || [])[0];

      if (req.user.role !== "SuperAdmin") {
        if (
          !prof ||
          prof.instituteId !== req.user.instituteId ||
          prof.role !== "Teacher"
        ) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      await cognito.send(
        new AdminSetUserPasswordCommand({
          UserPoolId: USER_POOL_ID,
          Username: email.toLowerCase(),
          Password: newPassword,
          Permanent: true,
        })
      );

      if (signOutAll) {
        await cognito.send(
          new AdminUserGlobalSignOutCommand({
            UserPoolId: USER_POOL_ID,
            Username: email.toLowerCase(),
          })
        );
      }

      res.json({ message: "Password reset" });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
