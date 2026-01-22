const { SESClient } = require("@aws-sdk/client-ses");

const REGION = process.env.AWS_REGION || "ap-south-1";

const ses = new SESClient({ region: REGION });

module.exports = { ses };
