// routes/adminMockTests/index.js
const express = require("express");
const create = require("./create");
const read = require("./read");
const update = require("./update");
const settings = require("./settings");
const deleteRouter = require("./delete");

const router = express.Router();

/**
 * IMPORTANT: mount order so /check-slug does not get swallowed by /:mockTestId
 * Keep 'create-mock' before any param-based readers in their own namespaces.
 */
router.use("/create-mock", create);     // POST /  +  GET /check-slug  -> /api/admin/mocktests/create-mock/...
router.use("/fetch", read);             // e.g. /api/admin/mocktests/fetch/:mockTestId
router.use("/update-mock", update);     // e.g. /api/admin/mocktests/update-mock/:mockTestId
router.use("/mock-settings", settings); // e.g. /api/admin/mocktests/mock-settings/:mockTestId
router.use("/delete-mock", deleteRouter);
router.use("/", require("./sections"));

module.exports = router;
