// // middleware/auth.js

// const { ddb } = require("../dynamo/client");
// const jwt = require("jose");
// const { enrichRequestUser } = require("./autoInstitute");

// const REGION = process.env.COGNITO_REGION || process.env.AWS_REGION || "ap-south-1";
// const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
// const APP_CLIENT_ID = process.env.COGNITO_APP_CLIENT_ID;
// const USERS_TABLE = process.env.DDB_USERS_TABLE || "EdzestUsers"; // ✅ DynamoDB Users Table

// /* -------------------------------------------------------------------------- */
// /*                          Cognito & Role Configs                            */
// /* -------------------------------------------------------------------------- */

// const ISSUER = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;
// const JWKS = jwt.createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks.json`));

// const ORDERED_ROLES = ["SuperAdmin", "Admin", "Teacher", "Student"];
// const pickHighestRole = (groups = []) => {
//   const s = new Set(groups);
//   for (const r of ORDERED_ROLES) if (s.has(r)) return r;
//   return "Student";
// };

// /* -------------------------------------------------------------------------- */
// /*                        🔐 Verify Cognito JWT Token                         */
// /* -------------------------------------------------------------------------- */
// async function verifyCognitoToken(token) {
//   const { payload } = await jwt.jwtVerify(token, JWKS, { issuer: ISSUER });

//   // Only accept access or ID tokens
//   if (!["access", "id"].includes(payload.token_use)) throw new Error("bad token_use");

//   // Validate audience (for ID tokens only)
//   if (
//     payload.token_use === "id" &&
//     payload.aud &&
//     APP_CLIENT_ID &&
//     payload.aud !== APP_CLIENT_ID
//   ) {
//     throw new Error("bad audience");
//   }

//   return payload;
// }

// /* -------------------------------------------------------------------------- */
// /*                            DynamoDB User Helpers                           */
// /* -------------------------------------------------------------------------- */
// async function getUser(sub) {
//   const r = await ddb.get({ TableName: USERS_TABLE, Key: { sub } }).promise();
//   return r.Item || null;
// }

// async function putUser(item) {
//   await ddb.put({ TableName: USERS_TABLE, Item: item }).promise();
// }

// /* -------------------------------------------------------------------------- */
// /*                         ✅ Auth Middleware (Main)                          */
// /* -------------------------------------------------------------------------- */
// async function authAccess(req, res, next) {
//   try {
//     const auth = req.headers.authorization || "";
//     const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
//     if (!token) return res.status(401).json({ message: "Unauthorized" });

//     // Verify and decode token
//     const p = await verifyCognitoToken(token);

//     const sub = p.sub;
//     const email = (p.email || "").toLowerCase();
//     const name = p.name || (email ? email.split("@")[0] : "User");
//     const groups = p["cognito:groups"] || [];
//     const role = pickHighestRole(groups);
//     const emailVerified = !!p.email_verified;

//     let user = await getUser(sub);
//     const now = new Date().toISOString();

//     // Create or update user in DynamoDB
//     if (!user) {
//       user = { sub, email, name, role, emailVerified, createdAt: now, updatedAt: now };
//       await putUser(user);
//     } else {
//       if (user.role !== role || user.emailVerified !== emailVerified) {
//         user.role = role;
//         user.emailVerified = emailVerified;
//         user.updatedAt = now;
//         await putUser(user);
//       }
//     }

//     // Attach user to request (legacy compatible shape)
//     req.user = { ...user, _id: sub, id: sub };
//     req.cognito = { sub, groups, tokenUse: p.token_use };

//     // 🔁 Auto-assign Edzest defaults to blank students (no-op if already set)
//     enrichRequestUser(req);

//     next();
//   } catch (err) {
//     // Optional debug log for development
//     // console.error("[authAccess] error:", err);
//     return res.status(401).json({ message: "Unauthorized" });
//   }
// }

// /* -------------------------------------------------------------------------- */
// /*                          🚫 Role Restriction Guard                         */
// /* -------------------------------------------------------------------------- */
// function requireRoles(allowed = []) {
//   const allowedSet = new Set(allowed.map((r) => String(r).toLowerCase()));

//   return (req, res, next) => {
//     if (!req.user) return res.status(401).json({ message: "Unauthorized" });

//     const role = (req.user.role || "").toLowerCase();
//     if (!allowedSet.has(role)) return res.status(403).json({ message: "Forbidden" });

//     next();
//   };
// }

// /* -------------------------------------------------------------------------- */
// /*                                   Export                                   */
// /* -------------------------------------------------------------------------- */
// module.exports = { authAccess, requireRoles };





// const { getUser, putUser } = require("../Services/aws/dynamo");
// const { verifyCognitoToken } = require("../Services/aws/jose");
// const { pickHighestRole } = require("../Services/roles");
// const { enrichRequestUser } = require("./autoInstitute");

// async function authAccess(req, res, next) {
//   try {
//     const auth  = req.headers.authorization || "";
//     const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
//     if (!token) return res.status(401).json({ message: "Unauthorized" });

//     const p = await verifyCognitoToken(token);
//     const sub = p.sub;
//     const email = (p.email || "").toLowerCase();
//     const name  = p.name || (email ? email.split("@")[0] : "User");
//     const groups = p["cognito:groups"] || [];
//     const role   = pickHighestRole(groups);
//     const emailVerified = !!p.email_verified;

//     let user = await getUser(sub);
//     const now = new Date().toISOString();

//     if (!user) {
//       user = { sub, email, name, role, emailVerified, createdAt: now, updatedAt: now };
//       await putUser(user);
//     } else {
//       if (user.role !== role || user.emailVerified !== emailVerified) {
//         user.role = role; user.emailVerified = emailVerified; user.updatedAt = now;
//         await putUser(user);
//       }
//     }

//     req.user    = { ...user, _id: sub, id: sub };
//     req.cognito = { sub, groups, tokenUse: p.token_use };

//     // request-scope defaults (no-op if already set)
//     enrichRequestUser(req);

//     next();
//   } catch {
//     return res.status(401).json({ message: "Unauthorized" });
//   }
// }

// function requireRoles(allowed = []) {
//   const allowedSet = new Set(allowed.map(r => String(r).toLowerCase()));
//   return (req, res, next) => {
//     if (!req.user) return res.status(401).json({ message: "Unauthorized" });
//     const role = (req.user.role || "").toLowerCase();
//     if (!allowedSet.has(role)) return res.status(403).json({ message: "Forbidden" });
//     next();
//   };
// }

// module.exports = { authAccess, requireRoles };




const { getUser, putUser } = require("../Services/aws/dynamo");
const { verifyCognitoToken } = require("../Services/aws/jose");
const { pickHighestRole } = require("../Services/roles");
const { enrichRequestUser } = require("./autoInstitute");

async function authAccess(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    // case-insensitive "Bearer", allow extra spaces
    const m = auth.match(/^Bearer\s+(.+)$/i);
    const token = m ? m[1].trim() : null;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const p = await verifyCognitoToken(token); // should already include small clockTolerance inside

    const sub = p.sub;
    const email = (p.email || "").toLowerCase();
    const name = p.name || (email ? email.split("@")[0] : "User");

    // always coerce groups to an array
    const groupsRaw = p["cognito:groups"];
    const groups = Array.isArray(groupsRaw) ? groupsRaw : (groupsRaw ? [groupsRaw] : []);
    const role = pickHighestRole(groups);

    // handle boolean or string from Cognito
    const emailVerified = p.email_verified === true || p.email_verified === "true";

    let user = await getUser(sub);
    const now = new Date().toISOString();

    if (!user) {
      user = { sub, email, name, role, emailVerified, createdAt: now, updatedAt: now };
      await putUser(user);
    } else {
      // only touch fields that come from identity provider and may change
      let dirty = false;
      if (user.role !== role) { user.role = role; dirty = true; }
      if (user.emailVerified !== emailVerified) { user.emailVerified = emailVerified; dirty = true; }
      if (dirty) {
        user.updatedAt = now;
        await putUser(user);
      }
    }

    req.user = { ...user, _id: sub, id: sub };
    req.cognito = { sub, groups, tokenUse: p.token_use };

    // request-scope defaults (no-op if already set); safe to await even if sync
    await Promise.resolve(enrichRequestUser(req));

    next();
  } catch (e) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

function requireRoles(allowed = []) {
  // Optional: if no roles specified, allow any authenticated user
  if (!allowed || allowed.length === 0) {
    return (req, res, next) => (req.user ? next() : res.status(401).json({ message: "Unauthorized" }));
  }

  const allowedSet = new Set(allowed.map((r) => String(r).toLowerCase()));
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const role = (req.user.role || "").toLowerCase();
    if (!allowedSet.has(role)) return res.status(403).json({ message: "Forbidden" });
    next();
  };
}

module.exports = { authAccess, requireRoles };
