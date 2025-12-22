// Services/aws/s3Read.js  (AWS SDK v3)
const {
  s3,
  GetObjectCommand,
  PutObjectCommand,
  getSignedUrl,
} = require("./s3");

/** Read JSON from S3 (v3) */
async function readJsonFromS3(Bucket, Key) {
  const obj = await s3.send(new GetObjectCommand({ Bucket, Key }));
  const body = await obj.Body.transformToString("utf8");
  return JSON.parse(body);
}

/** Write JSON to S3 (v3) */
async function putJsonToS3(Bucket, Key, data, cacheSeconds = 0) {
  const Body = Buffer.from(JSON.stringify(data, null, 2), "utf8");

  await s3.send(
    new PutObjectCommand({
      Bucket,
      Key,
      Body,
      ContentType: "application/json",
      CacheControl: cacheSeconds
        ? `public, max-age=${cacheSeconds}`
        : undefined,
    })
  );
}

/** Generate public URL from s3://bucket/key */
function httpUrlFromS3Uri(s3uri, region = "") {
  const m = String(s3uri || "").match(/^s3:\/\/([^/]+)\/(.+)$/i);
  if (!m) return s3uri || "";
  const [, bucket, key] = m;

  return region
    ? `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(
        key
      ).replace(/%2F/g, "/")}`
    : `https://${bucket}.s3.amazonaws.com/${encodeURIComponent(key).replace(
        /%2F/g,
        "/"
      )}`;
}

/** Signed URL (v3) */
async function getSignedUrlForS3(Bucket, Key, expires = 900) {
  return await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket, Key }),
    { expiresIn: expires }
  );
}

module.exports = {
  readJsonFromS3,
  putJsonToS3,
  httpUrlFromS3Uri,
  getSignedUrlForS3,
};
