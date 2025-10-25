const express = require('express');
const router = express.Router();
const {
  getSalariesWithPagination,
  generateSalaries,
  createSalary,
  updateSalary,
  finalizeSalaries,
  getSalaryById,
  deleteSalary
} = require('../controllers/employeeSalaryController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get salaries with pagination
router.get('/', getSalariesWithPagination);

// Create individual salary entry
router.post('/', createSalary);

// Generate salaries for a month/year
router.post('/generate', generateSalaries);

// Finalize salaries for a month/year
router.post('/finalize', finalizeSalaries);

// Get salary by ID
router.get('/:id', getSalaryById);

// Update salary entry
router.put('/:id', updateSalary);

// Delete salary entry
router.delete('/:id', deleteSalary);

module.exports = router;
