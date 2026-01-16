




// const { getUser, putUser } = require("../Services/aws/dynamo");
// const { verifyCognitoToken } = require("../Services/aws/jose");
// const { pickHighestRole } = require("../Services/roles");
// const { enrichRequestUser } = require("./autoInstitute");

// async function authAccess(req, res, next) {
//   try {
//     const auth = req.headers.authorization || "";
//     // case-insensitive "Bearer", allow extra spaces
//     const m = auth.match(/^Bearer\s+(.+)$/i);
//     const token = m ? m[1].trim() : null;
//     if (!token) return res.status(401).json({ message: "Unauthorized" });

//     const p = await verifyCognitoToken(token); // should already include small clockTolerance inside

//     const sub = p.sub;
//     const email = (p.email || "").toLowerCase();
//     const name = p.name || (email ? email.split("@")[0] : "User");

//     // always coerce groups to an array
//     const groupsRaw = p["cognito:groups"];
//     const groups = Array.isArray(groupsRaw) ? groupsRaw : (groupsRaw ? [groupsRaw] : []);
//     const role = pickHighestRole(groups);

//     // handle boolean or string from Cognito
//     const emailVerified = p.email_verified === true || p.email_verified === "true";

//     let user = await getUser(sub);
//     const now = new Date().toISOString();

//     if (!user) {
//       user = { sub, email, name, role, emailVerified, createdAt: now, updatedAt: now };
//       await putUser(user);
//     } else {
//       // only touch fields that come from identity provider and may change
//       let dirty = false;
//       if (user.role !== role) { user.role = role; dirty = true; }
//       if (user.emailVerified !== emailVerified) { user.emailVerified = emailVerified; dirty = true; }
//       if (dirty) {
//         user.updatedAt = now;
//         await putUser(user);
//       }
//     }

//     req.user = { ...user, _id: sub, id: sub };
//     req.cognito = { sub, groups, tokenUse: p.token_use };

//     // request-scope defaults (no-op if already set); safe to await even if sync
//     await Promise.resolve(enrichRequestUser(req));

//     next();
//   } catch (e) {
//     return res.status(401).json({ message: "Unauthorized" });
//   }
// }

// function requireRoles(allowed = []) {
//   // Optional: if no roles specified, allow any authenticated user
//   if (!allowed || allowed.length === 0) {
//     return (req, res, next) => (req.user ? next() : res.status(401).json({ message: "Unauthorized" }));
//   }

//   const allowedSet = new Set(allowed.map((r) => String(r).toLowerCase()));
//   return (req, res, next) => {
//     if (!req.user) return res.status(401).json({ message: "Unauthorized" });
//     const role = (req.user.role || "").toLowerCase();
//     if (!allowedSet.has(role)) return res.status(403).json({ message: "Forbidden" });
    
//     next();
//   };
// }

// module.exports = { authAccess, requireRoles };






// const { getUser, putUser } = require("../Services/aws/dynamo");
// const { verifyCognitoToken } = require("../Services/aws/jose");
// const { pickHighestRole } = require("../Services/roles");
// const { enrichRequestUser } = require("./autoInstitute");

// /* ======================================================
//    AUTH ACCESS (UNCHANGED LOGIC)
// ====================================================== */
// async function authAccess(req, res, next) {
//   try {
//     const auth = req.headers.authorization || "";

//     // case-insensitive "Bearer", allow extra spaces
//     const m = auth.match(/^Bearer\s+(.+)$/i);
//     const token = m ? m[1].trim() : null;

//     if (!token) {
//       console.log("⛔ AUTH DEBUG: Missing token");
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     const p = await verifyCognitoToken(token);

//     const sub = p.sub;
//     const email = (p.email || "").toLowerCase();
//     const name = p.name || (email ? email.split("@")[0] : "User");

//     // always coerce groups to an array
//     const groupsRaw = p["cognito:groups"];
//     const groups = Array.isArray(groupsRaw)
//       ? groupsRaw
//       : groupsRaw
//       ? [groupsRaw]
//       : [];

//     const role = pickHighestRole(groups);

//     // handle boolean or string from Cognito
//     const emailVerified =
//       p.email_verified === true || p.email_verified === "true";

//     let user = await getUser(sub);
//     const now = new Date().toISOString();

//     if (!user) {
//       user = {
//         sub,
//         email,
//         name,
//         role,
//         emailVerified,
//         createdAt: now,
//         updatedAt: now,
//       };
//       await putUser(user);
//     } else {
//       let dirty = false;

//       if (user.role !== role) {
//         user.role = role;
//         dirty = true;
//       }

//       if (user.emailVerified !== emailVerified) {
//         user.emailVerified = emailVerified;
//         dirty = true;
//       }

//       if (dirty) {
//         user.updatedAt = now;
//         await putUser(user);
//       }
//     }

//     req.user = { ...user, _id: sub, id: sub };
//     req.cognito = { sub, groups, tokenUse: p.token_use };

//     // request-scope defaults
//     await Promise.resolve(enrichRequestUser(req));

//     // 🔍 DEBUG (TEMP)
//     console.log("🔑 AUTH ACCESS OK:", {
//       email: req.user.email,
//       role: req.user.role,
//       groups,
//     });

//     next();
//   } catch (e) {
//     console.error("⛔ AUTH ACCESS FAILED:", e.message);
//     return res.status(401).json({ message: "Unauthorized" });
//   }
// }

// /* ======================================================
//    ROLE GUARD (UNCHANGED LOGIC)
// ====================================================== */
// function requireRoles(allowed = []) {
//   // If no roles specified → allow any authenticated user
//   if (!allowed || allowed.length === 0) {
//     return (req, res, next) =>
//       req.user ? next() : res.status(401).json({ message: "Unauthorized" });
//   }

//   const allowedSet = new Set(allowed.map((r) => String(r).toLowerCase()));

//   return (req, res, next) => {
//     if (!req.user) {
//       console.log("⛔ ROLE DEBUG: No req.user");
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     const role = (req.user.role || "").toLowerCase();

//     if (!allowedSet.has(role)) {
//       console.log("⛔ ROLE BLOCKED:", {
//         email: req.user.email,
//         role,
//         allowed: [...allowedSet],
//       });
//       return res.status(403).json({ message: "Forbidden" });
//     }

//     // 🔐 DEBUG (TEMP)
//     console.log("🔐 ROLE ALLOWED:", {
//       email: req.user.email,
//       role,
//     });

//     next();
//   };
// }

// module.exports = { authAccess, requireRoles };


const { getUser, putUser } = require("../Services/aws/dynamo");
const { verifyCognitoToken } = require("../Services/aws/jose");
const { pickHighestRole } = require("../Services/roles");
const { enrichRequestUser } = require("./autoInstitute");

/* ======================================================
   AUTH ACCESS (UNCHANGED LOGIC)
====================================================== */
async function authAccess(req, res, next) {
  try {
    const auth = req.headers.authorization || "";

    // case-insensitive "Bearer", allow extra spaces
    const m = auth.match(/^Bearer\s+(.+)$/i);
    const token = m ? m[1].trim() : null;

    if (!token) {
      console.log("⛔ AUTH DEBUG: Missing token");
      return res.status(401).json({ message: "Unauthorized" });
    }

    const p = await verifyCognitoToken(token);

    const sub = p.sub;
    const email = (p.email || "").toLowerCase();
    const name = p.name || (email ? email.split("@")[0] : "User");

    // always coerce groups to an array
    const groupsRaw = p["cognito:groups"];
    const groups = Array.isArray(groupsRaw)
      ? groupsRaw
      : groupsRaw
      ? [groupsRaw]
      : [];

    const role = pickHighestRole(groups);

    // handle boolean or string from Cognito
    const emailVerified =
      p.email_verified === true || p.email_verified === "true";

    let user = await getUser(sub);
    const now = new Date().toISOString();

    if (!user) {
      user = {
        sub,
        email,
        name,
        role,
        emailVerified,
        createdAt: now,
        updatedAt: now,
      };
      await putUser(user);
    } else {
      let dirty = false;

      if (user.role !== role) {
        user.role = role;
        dirty = true;
      }

      if (user.emailVerified !== emailVerified) {
        user.emailVerified = emailVerified;
        dirty = true;
      }

      if (dirty) {
        user.updatedAt = now;
        await putUser(user);
      }
    }

    req.user = { ...user, _id: sub, id: sub };
    req.cognito = { sub, groups, tokenUse: p.token_use };

    // request-scope defaults
    await Promise.resolve(enrichRequestUser(req));

    // 🔍 DEBUG (TEMP)
    console.log("🔑 AUTH ACCESS OK:", {
      email: req.user.email,
      role: req.user.role,
      groups,
    });

    next();
  } catch (e) {
    console.error("⛔ AUTH ACCESS FAILED:", e.message);
    return res.status(401).json({ message: "Unauthorized" });
  }
}

/* ======================================================
   ROLE GUARD (SAFE + CASE-INSENSITIVE)
   👉 EXISTING LOGIC PRESERVED
====================================================== */
function requireRoles(allowed = []) {
  // If no roles specified → allow any authenticated user
  if (!allowed || allowed.length === 0) {
    return (req, res, next) =>
      req.user ? next() : res.status(401).json({ message: "Unauthorized" });
  }

  // normalize allowed roles once
  const allowedSet = new Set(allowed.map((r) => String(r).toLowerCase()));

  return (req, res, next) => {
    if (!req.user) {
      console.log("⛔ ROLE DEBUG: No req.user");
      return res.status(401).json({ message: "Unauthorized" });
    }

    const role = String(req.user.role || "").toLowerCase();

    if (!allowedSet.has(role)) {
      console.log("⛔ ROLE BLOCKED:", {
        email: req.user.email,
        role,
        allowed: [...allowedSet],
      });
      return res.status(403).json({ message: "Forbidden" });
    }

    // 🔐 DEBUG (TEMP)
    console.log("🔐 ROLE ALLOWED:", {
      email: req.user.email,
      role,
    });

    next();
  };
}

module.exports = { authAccess, requireRoles };
