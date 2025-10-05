const express = require('express');
const router = express.Router();

const { AuthCheck } = require('../middlewares/Auth');

// Publicly accessible login route
router.use('/login', require('./LoginRoute'));

// Protected routes
router.use('/assignments', AuthCheck, require('./AssignmentsRoute'));
router.use('/assignments/submissions', AuthCheck, require('./SubmissionsRoute'));

module.exports = router;