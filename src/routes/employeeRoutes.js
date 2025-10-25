const express = require('express');
const router = express.Router();
const {
  getEmployeesWithPagination,
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
} = require('../controllers/employeeController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get employees with pagination
router.get('/', getEmployeesWithPagination);

// Get all employees (for dropdowns)
router.get('/all', getAllEmployees);

// Get employee by ID
router.get('/:id', getEmployeeById);

// Create new employee
router.post('/', createEmployee);

// Update employee
router.put('/:id', updateEmployee);

// Delete employee
router.delete('/:id', deleteEmployee);

module.exports = router;
