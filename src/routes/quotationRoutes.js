const express = require('express');
const { 
  getAllQuotations, 
  getQuotationById, 
  createQuotation, 
  updateQuotation, 
  deleteQuotation,
  getQuotationsWithPagination,
  searchQuotations,
  getQuotationsByCustomerId
} = require('../controllers/quotationController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/quotations (with pagination - for frontend)
router.get('/', getQuotationsWithPagination);

// GET /api/quotations/all (get all quotations without pagination)
router.get('/all', getAllQuotations);

// GET /api/quotations/search (search quotations by various criteria)
router.get('/search', searchQuotations);

// GET /api/quotations/customer/:customerId (get quotations by customer ID)
router.get('/customer/:customerId', getQuotationsByCustomerId);

// GET /api/quotations/:id
router.get('/:id', getQuotationById);

// POST /api/quotations
router.post('/', createQuotation);

// PUT /api/quotations/:id
router.put('/:id', updateQuotation);

// DELETE /api/quotations/:id
router.delete('/:id', deleteQuotation);

module.exports = router;
