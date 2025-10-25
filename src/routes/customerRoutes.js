const express = require('express');
const { 
  getAllCustomers, 
  getCustomerById, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer,
  getCustomersWithPagination,
  searchCustomersWithPagination,
  getCustomerMaterialsWithPrices
} = require('../controllers/customerController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/customers (with pagination - for frontend)
router.get('/', getCustomersWithPagination);

// GET /api/customers/all (get all customers without pagination)
router.get('/all', getAllCustomers);

// GET /api/customers/search (search customers with pagination for autocomplete)
router.get('/search', searchCustomersWithPagination);

// GET /api/customers/:customerId/materials (must be before /:id route)
router.get('/:customerId/materials', getCustomerMaterialsWithPrices);

// GET /api/customers/:id
router.get('/:id', getCustomerById);

// POST /api/customers
router.post('/', createCustomer);

// PUT /api/customers/:id
router.put('/:id', updateCustomer);

// DELETE /api/customers/:id
router.delete('/:id', deleteCustomer);

module.exports = router;
