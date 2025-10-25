const express = require('express');
const router = express.Router();
const { getDashboardSummary } = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// GET /api/dashboard/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/summary', getDashboardSummary);

module.exports = router;


