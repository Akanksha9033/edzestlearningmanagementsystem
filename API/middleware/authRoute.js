// const express = require("express");
// const router = express.Router();
// const rateLimit = require("express-rate-limit");
// const cookieParser = require("cookie-parser");

// const {
//   cognito,
//   SignUpCommand,
//   ConfirmSignUpCommand,
//   InitiateAuthCommand,
//   RespondToAuthChallengeCommand,
//   GetUserCommand,
//   AdminListGroupsForUserCommand,
//   GlobalSignOutCommand,
//   ForgotPasswordCommand,
//   ConfirmForgotPasswordCommand,
//   ChangePasswordCommand,
//   ResendConfirmationCodeCommand,
//   APP_CLIENT_ID,
//   USER_POOL_ID,
// } = require("../Services/aws/cognito");

// const { ensureProfile } = require("../Services/userProfile");
// const { pickHighestRole } = require("../Services/roles");  
// const { jwtVerify, createRemoteJWKSet } = require("jose");
// const { ISSUER } = require("../Services/aws/jose");
// const { setRefreshCookie, clearRefreshCookie } = require("./helpers/cookies");

// const tight = rateLimit({ windowMs: 60 * 1000, max: 20 });
// router.use(cookieParser());

// const JWKS_LOGIN = createRemoteJWKSet(
//   new URL(`${ISSUER}/.well-known/jwks.json`)
// );

// /* =============================
//    REGISTER
// ============================= */
// router.post("/register", tight, async (req, res) => {
//   try {
//     const { name, email, password } = req.body || {};
//     if (!name || !email || !password)
//       return res.status(400).json({ message: "Missing fields" });

//     await cognito.send(
//       new SignUpCommand({
//         ClientId: APP_CLIENT_ID,
//         Username: email.toLowerCase(),
//         Password: password,
//         UserAttributes: [
//           { Name: "email", Value: email.toLowerCase() },
//           { Name: "name", Value: name },
//         ],
//       })
//     );

//     await ensureProfile({
//       sub: `pending:${email.toLowerCase()}`,
//       email: email.toLowerCase(),
//       name,
//       role: "Student",
//       emailVerified: false,
//     });

//     res.status(201).json({ message: "Registered. Please verify email." });
//   } catch (e) {
//     console.log("🔥 SIGNUP ERROR:", e);

//     if (e.name === "UsernameExistsException")
//       return res.status(409).json({ message: "Email already in use" });

//     if (e.name === "InvalidPasswordException")
//       return res.status(400).json({ message: "Weak password" });

//     return res.status(500).json({ message: "Server error" });
//   }
// });

// /* =============================
//    VERIFY EMAIL
// ============================= */
// router.post("/verify-email", tight, async (req, res) => {
//   try {
//     const { email, code } = req.body || {};
//     if (!email || !code)
//       return res.status(400).json({ message: "Missing fields" });

//     await cognito.send(
//       new ConfirmSignUpCommand({
//         ClientId: APP_CLIENT_ID,
//         Username: email.toLowerCase(),
//         ConfirmationCode: code,
//       })
//     );

//     res.json({ message: "Email verified" });
//   } catch {
//     res.status(400).json({ message: "Invalid or expired code" });
//   }
// });

// /* =============================
//    LOGIN + NEW_PASSWORD_REQUIRED
// ============================= */
// router.post("/login", tight, async (req, res) => {
//   try {
//     const { email, password, newPassword } = req.body || {};
//     if (!email || !password)
//       return res.status(400).json({ message: "Missing fields" });

//     const username = email.toLowerCase();

//     let init = await cognito.send(
//       new InitiateAuthCommand({
//         AuthFlow: "USER_PASSWORD_AUTH",
//         ClientId: APP_CLIENT_ID,
//         AuthParameters: {
//           USERNAME: username,
//           PASSWORD: password,
//         },
//       })
//     );

//     if (init.ChallengeName === "NEW_PASSWORD_REQUIRED") {
//       if (!newPassword)
//         return res.status(409).json({
//           challenge: "NEW_PASSWORD_REQUIRED",
//           message: "NEW_PASSWORD_REQUIRED",
//         });

//       const fin = await cognito.send(
//         new RespondToAuthChallengeCommand({
//           ChallengeName: "NEW_PASSWORD_REQUIRED",
//           ClientId: APP_CLIENT_ID,
//           Session: init.Session,
//           ChallengeResponses: {
//             USERNAME: username,
//             NEW_PASSWORD: newPassword,
//           },
//         })
//       );

//       init.AuthenticationResult = fin.AuthenticationResult;
//     }

//     const { AccessToken, IdToken, RefreshToken } = init.AuthenticationResult;

//     const userInfo = await cognito.send(new GetUserCommand({ AccessToken }));

//     const attrs = Object.fromEntries(
//       userInfo.UserAttributes.map((a) => [a.Name, a.Value])
//     );

//     const emailVerified = attrs.email_verified === "true";
//     const name = attrs.name || username.split("@")[0];

//     const groupsResp = await cognito.send(
//       new AdminListGroupsForUserCommand({
//         UserPoolId: USER_POOL_ID,
//         Username: username,
//       })
//     );

//     const groups = (groupsResp.Groups || []).map((g) => g.GroupName);
//     const role = pickHighestRole(groups);

//     let sub;
//     try {
//       const { payload } = await jwtVerify(IdToken, JWKS_LOGIN, {
//         issuer: ISSUER,
//         clockTolerance: 5,
//       });
//       sub = payload.sub;
//     } catch {
//       sub = attrs.sub;
//     }

//     const profile = await ensureProfile({
//       sub,
//       email: username,
//       name,
//       role,
//       emailVerified,
//     });

//     setRefreshCookie(req, res, RefreshToken);

//     res.json({
//       accessToken: AccessToken,
//       user: {
//         id: sub,
//         _id: sub,
//         name,
//         email: username,
//         role,
//         instituteId: profile?.instituteId || null,
//         instituteName: profile?.instituteName || "",
//         emailVerified,
//       },
//       refreshTtlDays: 30,
//     });
//   } catch (e) {
//     console.log("🔥 LOGIN ERROR:", e);

//     if (e.name === "NotAuthorizedException")
//       return res.status(401).json({ message: "Invalid username or password" });

//     if (e.name === "UserNotConfirmedException")
//       return res.status(403).json({ message: "Email not verified" });

//     res.status(500).json({ message: "Server error" });
//   }
// });

// /* =============================
//    REFRESH TOKEN
// ============================= */
// router.post("/refresh", tight, async (req, res) => {
//   try {
//     const token = req.cookies?.refreshToken;
//     if (!token) return res.status(401).json({ message: "No refresh token" });

//     const resp = await cognito.send(
//       new InitiateAuthCommand({
//         AuthFlow: "REFRESH_TOKEN_AUTH",
//         ClientId: APP_CLIENT_ID,
//         AuthParameters: { REFRESH_TOKEN: token },
//       })
//     );

//     res.json({
//       accessToken: resp.AuthenticationResult.AccessToken,
//     });
//   } catch (e) {
//     console.log("🔥 REFRESH ERROR:", e);
//     res.status(401).json({ message: "Refresh failed" });
//   }
// });

// /* =============================
//    FORGOT PASSWORD
// ============================= */
// router.post("/forgot-password", tight, async (req, res) => {
//   try {
//     const { email } = req.body || {};
//     if (!email) return res.status(400).json({ message: "Email required" });

//     await cognito.send(
//       new ForgotPasswordCommand({
//         ClientId: APP_CLIENT_ID,
//         Username: email.toLowerCase(),
//       })
//     );

//     res.json({ message: "Reset code sent" });
//   } catch {
//     res.json({ message: "Reset code sent" });
//   }
// });

// /* =============================
//    CONFIRM FORGOT PASSWORD
// ============================= */
// router.post("/confirm-forgot-password", tight, async (req, res) => {
//   try {
//     const { email, code, newPassword } = req.body || {};
//     if (!email || !code || !newPassword)
//       return res.status(400).json({ message: "Missing fields" });

//     await cognito.send(
//       new ConfirmForgotPasswordCommand({
//         ClientId: APP_CLIENT_ID,
//         Username: email.toLowerCase(),
//         ConfirmationCode: code,
//         Password: newPassword,
//       })
//     );

//     res.json({ message: "Password reset" });
//   } catch {
//     res.status(400).json({ message: "Invalid code or weak password" });
//   }
// });

// /* =============================
//    LOGOUT
// ============================= */
// router.post("/logout", async (req, res) => {
//   try {
//     const hdr = req.headers.authorization || "";
//     const accessToken = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;

//     if (accessToken) {
//       try {
//         await cognito.send(
//           new GlobalSignOutCommand({ AccessToken: accessToken })
//         );
//       } catch {}
//     }

//     clearRefreshCookie(req, res);
//     res.json({ message: "Logged out" });
//   } catch {
//     res.json({ message: "Logged out" });
//   }
// });

// module.exports = router;


const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");

const {
  cognito,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  GetUserCommand,
  AdminListGroupsForUserCommand,
  GlobalSignOutCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  ChangePasswordCommand,
  ResendConfirmationCodeCommand,
  APP_CLIENT_ID,
  USER_POOL_ID,
} = require("../Services/aws/cognito");

const { ensureProfile } = require("../Services/userProfile");
const { pickHighestRole } = require("../Services/roles");
const { jwtVerify, createRemoteJWKSet } = require("jose");
const { ISSUER } = require("../Services/aws/jose");
const { setRefreshCookie, clearRefreshCookie } = require("./helpers/cookies");

const tight = rateLimit({ windowMs: 60 * 1000, max: 20 });
router.use(cookieParser());

const JWKS_LOGIN = createRemoteJWKSet(
  new URL(`${ISSUER}/.well-known/jwks.json`)
);

/* =============================
   REGISTER
============================= */
router.post("/register", tight, async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password)
      return res.status(400).json({ message: "Missing fields" });

    await cognito.send(
      new SignUpCommand({
        ClientId: APP_CLIENT_ID,
        Username: email.toLowerCase(),
        Password: password,
        UserAttributes: [
          { Name: "email", Value: email.toLowerCase() },
          { Name: "name", Value: name },
        ],
      })
    );

    await ensureProfile({
      sub: `pending:${email.toLowerCase()}`,
      email: email.toLowerCase(),
      name,
      role: "Student",
      emailVerified: false,
    });

    res.status(201).json({ message: "Registered. Please verify email." });
  } catch (e) {
    console.log("🔥 SIGNUP ERROR:", e);

    if (e.name === "UsernameExistsException")
      return res.status(409).json({ message: "Email already in use" });

    if (e.name === "InvalidPasswordException")
      return res.status(400).json({ message: "Weak password" });

    return res.status(500).json({ message: "Server error" });
  }
});

/* =============================
   VERIFY EMAIL
============================= */
router.post("/verify-email", tight, async (req, res) => {
  try {
    const { email, code } = req.body || {};
    if (!email || !code)
      return res.status(400).json({ message: "Missing fields" });

    await cognito.send(
      new ConfirmSignUpCommand({
        ClientId: APP_CLIENT_ID,
        Username: email.toLowerCase(),
        ConfirmationCode: code,
      })
    );

    res.json({ message: "Email verified" });
  } catch {
    res.status(400).json({ message: "Invalid or expired code" });
  }
});

/* =============================
   LOGIN + NEW_PASSWORD_REQUIRED
============================= */
router.post("/login", tight, async (req, res) => {
  try {
    const { email, password, newPassword } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ message: "Missing fields" });

    const username = email.toLowerCase();

    let init = await cognito.send(
      new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: APP_CLIENT_ID,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
      })
    );

    if (init.ChallengeName === "NEW_PASSWORD_REQUIRED") {
      if (!newPassword)
        return res.status(409).json({
          challenge: "NEW_PASSWORD_REQUIRED",
          message: "NEW_PASSWORD_REQUIRED",
        });

      const fin = await cognito.send(
        new RespondToAuthChallengeCommand({
          ChallengeName: "NEW_PASSWORD_REQUIRED",
          ClientId: APP_CLIENT_ID,
          Session: init.Session,
          ChallengeResponses: {
            USERNAME: username,
            NEW_PASSWORD: newPassword,
          },
        })
      );

      init.AuthenticationResult = fin.AuthenticationResult;
    }

    const { AccessToken, IdToken, RefreshToken } = init.AuthenticationResult;

    const userInfo = await cognito.send(new GetUserCommand({ AccessToken }));

    const attrs = Object.fromEntries(
      userInfo.UserAttributes.map((a) => [a.Name, a.Value])
    );

    const emailVerified = attrs.email_verified === "true";
    const name = attrs.name || username.split("@")[0];

    const groupsResp = await cognito.send(
      new AdminListGroupsForUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
      })
    );

    const groups = (groupsResp.Groups || []).map((g) => g.GroupName);
    const role = pickHighestRole(groups);

    let sub;
    try {
      const { payload } = await jwtVerify(IdToken, JWKS_LOGIN, {
        issuer: ISSUER,
        clockTolerance: 5,
      });
      sub = payload.sub;
    } catch {
      sub = attrs.sub;
    }

    const profile = await ensureProfile({
      sub,
      email: username,
      name,
      role,
      emailVerified,
    });

    setRefreshCookie(req, res, RefreshToken);

    res.json({
      accessToken: AccessToken,
      user: {
        id: sub,
        _id: sub,
        name,
        email: username,
        role,
        instituteId: profile?.instituteId || null,
        instituteName: profile?.instituteName || "",
        emailVerified,
      },
      refreshTtlDays: 30,
    });
  } catch (e) {
    console.log("🔥 LOGIN ERROR:", e);

    if (e.name === "NotAuthorizedException")
      return res.status(401).json({ message: "Invalid username or password" });

    if (e.name === "UserNotConfirmedException")
      return res.status(403).json({ message: "Email not verified" });

    res.status(500).json({ message: "Server error" });
  }
});

/* =============================
   REFRESH TOKEN
============================= */
router.post("/refresh", tight, async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    const resp = await cognito.send(
      new InitiateAuthCommand({
        AuthFlow: "REFRESH_TOKEN_AUTH",
        ClientId: APP_CLIENT_ID,
        AuthParameters: { REFRESH_TOKEN: token },
      })
    );

    res.json({
      accessToken: resp.AuthenticationResult.AccessToken,
    });
  } catch (e) {
    console.log("🔥 REFRESH ERROR:", e);
    res.status(401).json({ message: "Refresh failed" });
  }
});

/* =============================
   FORGOT PASSWORD
============================= */
router.post("/forgot-password", tight, async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: "Email required" });

    await cognito.send(
      new ForgotPasswordCommand({
        ClientId: APP_CLIENT_ID,
        Username: email.toLowerCase(),
      })
    );

    res.json({ message: "Reset code sent" });
  } catch {
    res.json({ message: "Reset code sent" });
  }
});

/* =============================
   CONFIRM FORGOT PASSWORD
============================= */
router.post("/confirm-forgot-password", tight, async (req, res) => {
  try {
    const { email, code, newPassword } = req.body || {};
    if (!email || !code || !newPassword)
      return res.status(400).json({ message: "Missing fields" });

    await cognito.send(
      new ConfirmForgotPasswordCommand({
        ClientId: APP_CLIENT_ID,
        Username: email.toLowerCase(),
        ConfirmationCode: code,
        Password: newPassword,
      })
    );

    res.json({ message: "Password reset" });
  } catch {
    res.status(400).json({ message: "Invalid code or weak password" });
  }
});

/* =============================
   LOGOUT
============================= */
router.post("/logout", async (req, res) => {
  try {
    const hdr = req.headers.authorization || "";
    const accessToken = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;

    if (accessToken) {
      try {
        await cognito.send(
          new GlobalSignOutCommand({ AccessToken: accessToken })
        );
      } catch {}
    }

    clearRefreshCookie(req, res);
    res.json({ message: "Logged out" });
  } catch {
    res.json({ message: "Logged out" });
  }
});

/* =============================
   ✅ NEW → ME (session verify)
   (NO CHANGE to your existing logic)
============================= */
router.get("/me", async (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token)
      return res.status(401).json({ message: "Unauthorized" });

    const { verifyCognitoToken } = require("../Services/aws/jose");
    const { getUser } = require("../Services/aws/dynamo");

    const payload = await verifyCognitoToken(token);
    const sub = payload.sub;

    const user = await getUser(sub);
    if (!user)
      return res.status(404).json({ message: "User not found" });

    return res.json({ user });
  } catch (e) {
    console.log("🔥 ME ERROR:", e);
    return res.status(401).json({ message: "Unauthorized" });
  }
});

module.exports = router;
