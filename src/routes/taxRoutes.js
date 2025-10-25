const express = require('express');
const router = express.Router();
const {
  getAllTaxes,
  getTaxById,
  updateTax,
  getTaxByServiceType,
  getTaxByServiceTypeForDate
} = require('../controllers/taxController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all tax records
router.get('/', getAllTaxes);

// Get tax by ID
router.get('/:id', getTaxById);

// Get tax by service type
router.get('/service-type/:serviceType', getTaxByServiceType);

// Get tax by service type for a specific date
router.get('/service-type/:serviceType/for-date', getTaxByServiceTypeForDate);

// Update tax percentage
router.put('/:id', updateTax);

module.exports = router;
