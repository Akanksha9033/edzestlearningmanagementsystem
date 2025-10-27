const AWS = require("./config");
const s3 = new AWS.S3();

module.exports = { s3 };
