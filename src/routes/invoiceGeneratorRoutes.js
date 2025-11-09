const express = require('express');
const router = express.Router();
const { generateInvoicePDF, generateInvoiceHTML, generateInvoiceWord } = require('../controllers/invoiceGeneratorController');
const { authenticateToken } = require('../middleware/auth');

// Generate invoice PDF
router.get('/invoice/:invoiceId', authenticateToken, generateInvoicePDF);

// Generate invoice HTML for preview
router.get('/invoice/:invoiceId/html', authenticateToken, generateInvoiceHTML);

// Generate invoice Word document
router.get('/invoice/:invoiceId/word', authenticateToken, generateInvoiceWord);

module.exports = router;
