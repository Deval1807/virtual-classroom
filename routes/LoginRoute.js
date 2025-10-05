const express = require('express');
const { LoginUser } = require('../controllers/LoginController')
const router = express.Router();

// Login route
router.post('/', LoginUser);

module.exports = router;