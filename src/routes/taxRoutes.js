const express = require('express');
const router = express.Router();
const {
  getAllTaxes,
  getTaxById,
  updateTax,
  getTaxByServiceType
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

// Update tax percentage
router.put('/:id', updateTax);

module.exports = router;
