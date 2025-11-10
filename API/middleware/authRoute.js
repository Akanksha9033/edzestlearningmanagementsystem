const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { APP_CLIENT_ID, USER_POOL_ID } = require("../Services/constants");
const { ensureProfile } = require("../Services/userProfile");
const { cognito } = require("../Services/aws/cognito");
const { pickHighestRole } = require("../Services/roles");
const { jwtVerify, createRemoteJWKSet } = require("jose");
const { ISSUER } = require("../Services/aws/jose");
const cookieParser = require("cookie-parser");

// ✅ NEW: request-aware cookie helpers (so localhost and prod both work)
const { setRefreshCookie, clearRefreshCookie } = require("./helpers/cookies");

// (rate limits unchanged)
const tight = rateLimit({ windowMs: 60 * 1000, max: 20 });
const looser = rateLimit({ windowMs: 60 * 60 * 1000, max: 200 });

// Keep these locally for login flow ID token decode parity
const JWKS_LOGIN = createRemoteJWKSet(
  new URL(`${ISSUER}/.well-known/jwks.json`)
);

// middlewares needed
router.use(cookieParser());

/** ===== Routes ===== */

// Register (Student)
router.post("/register", tight, async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password)
      return res.status(400).json({ message: "Missing fields" });

    await cognito
      .signUp({
        ClientId: APP_CLIENT_ID,
        Username: String(email).trim().toLowerCase(),
        Password: password,
        UserAttributes: [
          { Name: "email", Value: String(email).trim().toLowerCase() },
          { Name: "name", Value: name },
        ],
      })
      .promise();

    await ensureProfile({
      sub: `pending:${String(email).toLowerCase()}`,
      email: String(email).toLowerCase(),
      name,
      role: "Student",
      emailVerified: false,
    });

    return res
      .status(201)
      .json({
        message: "Registered. Check your email for the verification code.",
      });
  } catch (e) {
    if (e.code === "UsernameExistsException") {
      return res.status(409).json({ message: "Email already in use" });
    }

      if (e.code === "InvalidPasswordException") {
      return res.status(400).json({
        message:
          "Please enter a strong password with at least 8 characters, including uppercase, lowercase, a number and a special character.",
      });
    }
    
    return res.status(500).json({ message: "Server error" });
  }
});

// Verify email
router.post("/verify-email", tight, async (req, res) => {
  try {
    let { email, code, token, userId } = req.body || {};
    if (!code && token) code = token;
    if (!email && userId && String(userId).includes("@")) email = userId;

    if (!email || !code)
      return res.status(400).json({ message: "Bad request" });

    await cognito
      .confirmSignUp({
        ClientId: APP_CLIENT_ID,
        Username: String(email).toLowerCase(),
        ConfirmationCode: String(code),
      })
      .promise();

    return res.json({ message: "Email verified" });
  } catch (e) {
    return res.status(400).json({ message: "Invalid or expired code" });
  }
});

// Login (with NEW_PASSWORD_REQUIRED)
router.post("/login", tight, async (req, res) => {
  try {
    const { email, password, newPassword } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ message: "Missing fields" });

    const username = String(email).toLowerCase();

    const init = await cognito
      .initiateAuth({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: APP_CLIENT_ID,
        AuthParameters: { USERNAME: username, PASSWORD: password },
      })
      .promise();

    if (init.ChallengeName === "NEW_PASSWORD_REQUIRED") {
      if (!newPassword) {
        return res
          .status(409)
          .json({
            challenge: "NEW_PASSWORD_REQUIRED",
            message: "NEW_PASSWORD_REQUIRED",
          });
      }

      const fin = await cognito
        .respondToAuthChallenge({
          ClientId: APP_CLIENT_ID,
          ChallengeName: "NEW_PASSWORD_REQUIRED",
          Session: init.Session,
          ChallengeResponses: {
            USERNAME: username,
            NEW_PASSWORD: newPassword,
          },
        })
        .promise();

      init.AuthenticationResult = fin.AuthenticationResult;
    }

    const accessToken = init.AuthenticationResult.AccessToken;
    const idToken = init.AuthenticationResult.IdToken;
    const refreshToken = init.AuthenticationResult.RefreshToken;

    // read user attributes & groups
    const me = await cognito.getUser({ AccessToken: accessToken }).promise();
    const attrs = Object.fromEntries(
      (me.UserAttributes || []).map((a) => [a.Name, a.Value])
    );
    const emailVerified = attrs.email_verified === "true";
    const name =
      attrs.name || (attrs.email ? attrs.email.split("@")[0] : "User");

    const groupsResp = await cognito
      .adminListGroupsForUser({
        UserPoolId: USER_POOL_ID,
        Username: username,
      })
      .promise();
    const groups = (groupsResp.Groups || []).map((g) => g.GroupName);
    const role = pickHighestRole(groups);

    let sub;
    try {
      const { payload } = await jwtVerify(idToken, JWKS_LOGIN, {
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

    // ✅ use request-aware cookie helper (works local + prod)
    setRefreshCookie(req, res, refreshToken);

    const safeUser = {
      id: sub,
      _id: sub,
      name,
      email: username,
      role,
      instituteId: profile?.instituteId || null,
      instituteName: profile?.instituteName || "",
      emailVerified,
    };

    return res.json({ accessToken, user: safeUser, refreshTtlDays: 30 });
  } catch (e) {
    if (
      e.code === "NotAuthorizedException" ||
      e.code === "UserNotFoundException"
    ) {
      return res.status(401).json({ message: "Invalid username or password." });
    }
    if (e.code === "UserNotConfirmedException") {
      return res.status(403).json({ message: "Email not verified." });
    }
    return res.status(500).json({ message: "Server error" });
  }
});

// Refresh (cookie)
router.post("/refresh", tight, async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh" });

    const resp = await cognito
      .initiateAuth({
        AuthFlow: "REFRESH_TOKEN_AUTH",
        ClientId: APP_CLIENT_ID,
        AuthParameters: { REFRESH_TOKEN: token },
      })
      .promise();

    const accessToken = resp.AuthenticationResult.AccessToken;

    // prevent caching anywhere
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.set("Pragma", "no-cache");

    return res.json({ accessToken });
  } catch {
    return res.status(401).json({ message: "Refresh failed" });
  }
});

// Logout
router.post("/logout", looser, async (req, res) => {
  try {
    const hdr = req.headers.authorization || "";
    const accessToken = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
    if (accessToken) {
      try {
        await cognito.globalSignOut({ AccessToken: accessToken }).promise();
      } catch {}
    }
    // ✅ use request-aware helper
    clearRefreshCookie(req, res);
    return res.json({ message: "Logged out" });
  } catch {
    return res.json({ message: "Logged out" });
  }
});

// Resend verify
router.post("/resend-verify", tight, async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: "Email required" });

    await cognito
      .resendConfirmationCode({
        ClientId: APP_CLIENT_ID,
        Username: String(email).toLowerCase(),
      })
      .promise();

    return res.json({ message: "Verification email resent" });
  } catch {
    return res
      .status(502)
      .json({ message: "Failed to send verification email" });
  }
});

// Me (protected)
const { authAccess } = require("../middleware/auth");
router.get("/me", authAccess, async (req, res) => {
  const u = req.user;
  return res.json({
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    instituteId: u.instituteId || null,
    instituteName: u.instituteName || "",
    emailVerified: u.emailVerified,
  });
});

// Sessions (Cognito not supported)
router.get("/sessions", authAccess, async (_req, res) =>
  res.json({ sessions: [] })
);

// Logout all (cookie clear)
router.post("/logout-all", authAccess, async (req, res) => {
  // ✅ use request-aware helper
  clearRefreshCookie(req, res);
  res.json({ message: "Logged out from all devices" });
});

// Change password
router.post("/change-password", authAccess, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body || {};
    const hdr = req.headers.authorization || "";
    const accessToken = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
    if (!oldPassword || !newPassword || !accessToken) {
      return res.status(400).json({ message: "Missing fields" });
    }
    await cognito
      .changePassword({
        PreviousPassword: oldPassword,
        ProposedPassword: newPassword,
        AccessToken: accessToken,
      })
      .promise();
    res.json({ message: "Password updated" });
  } catch (e) {
    const msg =
      e.code === "NotAuthorizedException"
        ? "Old password incorrect"
        : "Server error";
    const status = e.code === "NotAuthorizedException" ? 401 : 500;
    res.status(status).json({ message: msg });
  }
});

// Forgot + confirm forgot
router.post("/forgot-password", tight, async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: "Email required" });
    await cognito
      .forgotPassword({
        ClientId: APP_CLIENT_ID,
        Username: String(email).toLowerCase(),
      })
      .promise();
    res.json({ message: "Reset code sent" });
  } catch {
    res.json({ message: "Reset code sent" });
  }
});

router.post("/confirm-forgot-password", tight, async (req, res) => {
  try {
    const { email, code, newPassword } = req.body || {};
    if (!email || !code || !newPassword)
      return res.status(400).json({ message: "Missing fields" });
    await cognito
      .confirmForgotPassword({
        ClientId: APP_CLIENT_ID,
        Username: String(email).toLowerCase(),
        ConfirmationCode: String(code),
        Password: newPassword,
      })
      .promise();
    res.json({ message: "Password reset" });
  } catch {
    res.status(400).json({ message: "Invalid code or password policy" });
  }
});

module.exports = router;
