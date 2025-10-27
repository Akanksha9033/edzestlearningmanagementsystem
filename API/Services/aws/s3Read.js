// Services/aws/s3Read.js
const { s3 } = require("./s3");

/** Read JSON from S3 and parse it */
async function readJsonFromS3(Bucket, Key) {
  const obj = await s3.getObject({ Bucket, Key }).promise();
  return JSON.parse(obj.Body.toString("utf8"));
}

/** Write JSON to S3 */
async function putJsonToS3(Bucket, Key, data, cacheSeconds = 0) {
  const Body = Buffer.from(JSON.stringify(data, null, 2), "utf8");
  const params = {
    Bucket,
    Key,
    Body,
    ContentType: "application/json",
    CacheControl: cacheSeconds ? `public, max-age=${cacheSeconds}` : undefined,
  };
  await s3.putObject(params).promise();
}

/** Generate a public https URL from an s3://bucket/key URI (no auth) */
function httpUrlFromS3Uri(s3uri, region = "") {
  const m = String(s3uri || "").match(/^s3:\/\/([^/]+)\/(.+)$/i);
  if (!m) return s3uri || "";
  const [, bucket, key] = m;
  // use virtual-hosted style; add region if you want a region-specific endpoint
  return region
    ? `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key).replace(/%2F/g, "/")}`
    : `https://${bucket}.s3.amazonaws.com/${encodeURIComponent(key).replace(/%2F/g, "/")}`;
}

/** Optional: make a short-lived signed URL (if objects are private) */
function getSignedUrl(Bucket, Key, expires = 900 /* 15 min */) {
  return s3.getSignedUrl("getObject", { Bucket, Key, Expires: expires });
}

module.exports = {
  readJsonFromS3,
  putJsonToS3,
  httpUrlFromS3Uri,
  getSignedUrl,
};
