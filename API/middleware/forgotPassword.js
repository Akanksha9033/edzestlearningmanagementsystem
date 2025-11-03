// middleware/forgotPassword.js
const express = require("express");
const rateLimit = require("express-rate-limit");
const { startForgotPassword, confirmForgotPassword } = require("../Services/aws/cognitoForgot");

const router = express.Router();

// 10 req / 15 min — prevents OTP spamming
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

router.post("/forgot/start", limiter, async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || String(username).trim() === "") return res.status(400).json({ error: "USERNAME_REQUIRED" });

    await startForgotPassword(String(username).trim());
    // Do NOT reveal if user exists — generic success
    return res.json({ ok: true });
  } catch (e) {
    // Map some common Cognito errors to generic messages
    const code = e?.name || "ERROR";
    if (code === "LimitExceededException") return res.status(429).json({ error: "TRY_LATER" });
    return res.json({ ok: true }); // still generic
  }
});

router.post("/forgot/confirm", limiter, async (req, res) => {
  try {
    const { username, code, newPassword } = req.body;
    if (!username || !code || !newPassword) return res.status(400).json({ error: "INVALID_INPUT" });

    await confirmForgotPassword({ username: String(username).trim(), code: String(code).trim(), newPassword: String(newPassword) });
    return res.json({ ok: true });
  } catch (e) {
    const code = e?.name || "ERROR";
    // Optional: normalize messages for UI
    const map = {
      CodeMismatchException: "INVALID_CODE",
      ExpiredCodeException: "EXPIRED_CODE",
      InvalidPasswordException: "WEAK_PASSWORD",
      LimitExceededException: "TRY_LATER",
      UserNotFoundException: "INVALID_CODE", // generic
    };
    return res.status(400).json({ error: map[code] || "RESET_FAILED" });
  }
});

module.exports = router;
