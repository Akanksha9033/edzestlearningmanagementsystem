// routes/adminMockTests/index.js

// ⭐ Express router (main router for all mock test admin routes)
const express = require("express");

// ⭐ Import sub-routers (each file handles one feature)
const create = require("./create");          // create new mock test
const read = require("./read");              // fetch mock test data
const update = require("./update");          // update mock test header
const settings = require("./settings");      // update mock test settings
const deleteRouter = require("./delete");    // delete mock test (soft + hard)

const router = express.Router();

/**
 * ⭐ IMPORTANT NOTE:
 *
 * Mounting order matters!
 * Example:
 *   /check-slug (under create-mock) should NOT be confused with /:mockTestId
 *
 * That means:
 *   - Routes with normal words (create-mock, fetch…) should come FIRST
 *   - Routes with parameters (/:mockTestId) should come LAST
 *
 * Otherwise Express may think:
 *   "/check-slug" = ":mockTestId"
 *
 * So, mount in this exact sequence.
 */

// ⭐ CREATE MOCK TEST ROUTES
// Example:
//   POST /api/admin/mocktests/create-mock/
//   GET  /api/admin/mocktests/create-mock/check-slug
router.use("/create-mock", create);

// ⭐ READ MOCK TEST ROUTES
// Example:
//   GET /api/admin/mocktests/fetch/:mockTestId
router.use("/fetch", read);

// ⭐ UPDATE MOCK TEST ROUTES
// Example:
//   PATCH /api/admin/mocktests/update-mock/:mockTestId
router.use("/update-mock", update);

// ⭐ SETTINGS ROUTES (marks, time, mode, config…)
// Example:
//   PATCH /api/admin/mocktests/mock-settings/:mockTestId
router.use("/mock-settings", settings);

// ⭐ DELETE MOCK TEST ROUTES
// Example:
//   DELETE /api/admin/mocktests/delete-mock/:mockTestId
router.use("/delete-mock", deleteRouter);

// ⭐ SECTIONS ROUTES (update sections, create sections, etc.)
// Mounted last because it contains parameter routes.
// Example:
//   PATCH /api/admin/mocktests/:mockTestId/sections
router.use("/", require("./sections"));

module.exports = router;
