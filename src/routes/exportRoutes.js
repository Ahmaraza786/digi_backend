const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { authenticateToken } = require('../middleware/auth');

// Test route
router.get('/test', exportController.testExport);

// Export paid invoices to CSV
router.get('/paid-invoices-csv', authenticateToken, exportController.exportPaidInvoicesCSV);

// Quotation export routes
router.get('/quotation/:quotationId', authenticateToken, exportController.generateQuotationPDF);
router.get('/quotation/:quotationId/html', authenticateToken, exportController.generateQuotationHTML);

module.exports = router;