// routes/zoom.js
const express = require("express");
const axios = require("axios");
const router = express.Router();
const { authAccess, requireRoles } = require("../../../../../middleware/auth");

async function getZoomAccessToken() {
  const { ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET } = process.env;
  if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
    throw new Error("Missing Zoom env vars");
  }
  const resp = await axios.post(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(ZOOM_ACCOUNT_ID)}`,
    null,
    { auth: { username: ZOOM_CLIENT_ID, password: ZOOM_CLIENT_SECRET } }
  );
  return resp.data.access_token;
}

router.post(
  "/create-meeting",
  authAccess,
  requireRoles(["Admin", "Teacher"]),
  async (req, res) => {
    try {
      const { topic, start_time, duration, agenda } = req.body;
      const accessToken = await getZoomAccessToken();

      const zr = await axios.post(
        "https://api.zoom.us/v2/users/me/meetings",
        {
          topic: topic || "Live Class",
          type: 2,
          start_time,
          timezone: "UTC",
          duration: Number(duration) || 60,
          agenda: agenda || "",
          settings: {
            join_before_host: false,
            mute_upon_entry: true,
            waiting_room: true,
            approval_type: 0,
          },
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      res.json({ id: zr.data.id, joinUrl: zr.data.join_url, startUrl: zr.data.start_url });
    } catch (err) {
      const payload = err?.response?.data || { message: err.message };
      console.error("❌ Zoom create-meeting failed:", payload);
      res.status(400).json(payload);
    }
  }
);

module.exports = router;
