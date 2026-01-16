const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

const REGION = process.env.AWS_REGION || "ap-south-1";
const USERS_TABLE = process.env.DDB_USERS_TABLE;

const ddbClient = new DynamoDBClient({ region: REGION });
const ddb = DynamoDBDocumentClient.from(ddbClient);

router.post("/auth/setup-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) {
      return res.status(400).json({ message: "token and newPassword required" });
    }

    // 1) find user by token (simple scan; later we can add GSI)
    const scan = await ddb.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: "passwordSetupToken = :t",
      ExpressionAttributeValues: { ":t": token },
      Limit: 1,
    }));

    const user = scan.Items?.[0];
    if (!user) return res.status(400).json({ message: "Invalid token" });

    if (!user.passwordSetupExpiry || new Date() > new Date(user.passwordSetupExpiry)) {
      return res.status(400).json({ message: "Link expired" });
    }

    const passwordHash = await bcrypt.hash(String(newPassword), 10);

    // 2) update user
    await ddb.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { sub: user.sub }, // your table primary key is sub
      UpdateExpression:
        "SET passwordHash = :ph, passwordSetByAdmin = :p, passwordSetupToken = :n, passwordSetupExpiry = :n, updatedAt = :u",
      ExpressionAttributeValues: {
        ":ph": passwordHash,
        ":p": false,
        ":n": null,
        ":u": new Date().toISOString(),
      },
    }));

    return res.json({ success: true });
  } catch (err) {
    console.error("setup-password error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
