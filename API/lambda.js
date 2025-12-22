// lambda.js — wraps your Express app for AWS Lambda
const serverless = require("serverless-http");

// Import the Express app (make sure index.js exports the app)
const app = require("./index.js");

// Enable binary for media streaming (HLS, MP4, audio, images, etc.)
module.exports.handler = serverless(app, {
  binary: [
    "application/octet-stream",
    "application/vnd.apple.mpegurl",
    "application/x-mpegURL",
    "video/*",
    "audio/*",
    "image/*",
  ],
});
