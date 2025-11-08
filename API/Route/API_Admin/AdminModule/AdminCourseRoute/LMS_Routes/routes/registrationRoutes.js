const express = require('express');
const router = express.Router();
const registerController = require('../controllers/registerController');  // ✅ Corrected import

router.post('/', registerController.registerUser);
router.get('/:eventId/download', registerController.downloadRegistrations);

module.exports = router;
