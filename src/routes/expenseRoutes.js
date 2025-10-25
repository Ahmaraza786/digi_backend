const express = require('express');
const router = express.Router();
const {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpensesSummary
} = require('../controllers/expenseController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/expenses - Get expenses for a specific month/year
router.get('/', getExpenses);

// POST /api/expenses - Create a new expense
router.post('/', createExpense);

// PUT /api/expenses/:id - Update an expense
router.put('/:id', updateExpense);

// DELETE /api/expenses/:id - Delete an expense
router.delete('/:id', deleteExpense);

// GET /api/expenses/summary - Get expenses summary for a month/year
router.get('/summary', getExpensesSummary);

module.exports = router;
