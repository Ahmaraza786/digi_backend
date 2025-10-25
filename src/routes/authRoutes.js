const express = require('express');
const { login, validateToken } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/v1/auth/login
router.post('/login', login);

// POST /api/auth/signin (for frontend compatibility)
router.post('/signin', login);

// GET /api/auth/validate (for frontend token validation)
router.get('/validate', authenticateToken, validateToken);

module.exports = router;
