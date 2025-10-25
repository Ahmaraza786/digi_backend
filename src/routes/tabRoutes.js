const express = require('express');
const { getAllTabs } = require('../controllers/tabController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/tabs/all - Get all tabs/features for role management
router.get('/all', getAllTabs);

module.exports = router;
