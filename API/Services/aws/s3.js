// ===================================================================
//   S3 v3 Wrapper (Safe, supports signed URLs, uploads, reads)
// ===================================================================

const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const REGION = process.env.AWS_REGION || "ap-south-1";

// Create SINGLE shared client (best for Lambda)
const s3 = new S3Client({ region: REGION });

/* ------------------------------------------------------------------
   Export v3 commands + a v2-style wrapper for `putObject`
   This makes your old code continue working:
   - s3.putObject({...}).promise()  ❌ NOT VALID in v3
   - but putObject({ ... })         ✅ works (wrapper)
------------------------------------------------------------------- */
module.exports = {
  s3,
  getSignedUrl,

  // raw commands
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,

  // v2-style helper for uploads
  putObject: (params) => s3.send(new PutObjectCommand(params)),
};
