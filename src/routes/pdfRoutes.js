const express = require('express');
const router = express.Router();
const pdfController = require('../controllers/pdfController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Generate challan PDF
router.get('/challan/:challanId/pdf', pdfController.generateChallanPDF);

// Generate challan preview (HTML)
router.get('/challan/:challanId/preview', pdfController.generateChallanPreview);

module.exports = router;
