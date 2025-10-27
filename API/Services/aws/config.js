const AWS = require("aws-sdk");
const { REGION } = require("../constants");

AWS.config.update({ region: REGION });

module.exports = AWS;
