const express = require('express');
const router = express.Router();
const {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoicesWithPagination,
  searchInvoices,
  getPurchaseOrdersByCustomer,
  getPurchaseOrderDetails
} = require('../controllers/invoiceController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all invoices (without pagination)
router.get('/all', getAllInvoices);

// Get invoices with pagination
router.get('/', getInvoicesWithPagination);

// Search invoices
router.get('/search', searchInvoices);

// Get purchase orders by customer ID
router.get('/purchase-orders/customer/:customerId', getPurchaseOrdersByCustomer);

// Get purchase order details for invoice creation
router.get('/purchase-order/:purchaseOrderId', getPurchaseOrderDetails);

// Get invoice by ID
router.get('/:id', getInvoiceById);

// Create new invoice
router.post('/', createInvoice);

// Update invoice
router.put('/:id', updateInvoice);

// Delete invoice
router.delete('/:id', deleteInvoice);

module.exports = router;
