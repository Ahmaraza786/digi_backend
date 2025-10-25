const express = require('express');
const router = express.Router();
const { generateInvoicePDF, generateInvoiceHTML } = require('../controllers/invoiceGeneratorController');
const { authenticateToken } = require('../middleware/auth');

// Generate invoice PDF
router.get('/invoice/:invoiceId', authenticateToken, generateInvoicePDF);

// Generate invoice HTML for preview
router.get('/invoice/:invoiceId/html', authenticateToken, generateInvoiceHTML);

module.exports = router;
