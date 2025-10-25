const { Expense } = require('../models');
const { Op } = require('sequelize');

// Get all expenses for a specific month/year
const getExpenses = async (req, res) => {
  try {
    const { month, year, page = 0, size = 10 } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({
        error: 'Month and year are required'
      });
    }

    const offset = page * size;
    const limit = parseInt(size);

    const { count, rows } = await Expense.findAndCountAll({
      where: {
        month: parseInt(month),
        year: parseInt(year)
      },
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    res.json({
      content: rows,
      totalElements: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      size: limit
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({
      error: 'Failed to fetch expenses'
    });
  }
};

// Create a new expense
const createExpense = async (req, res) => {
  try {
    const { description, amount, month, year } = req.body;

    // Validation
    if (!description || !amount || !month || !year) {
      return res.status(400).json({
        error: 'Description, amount, month, and year are required'
      });
    }

    if (parseFloat(amount) < 0) {
      return res.status(400).json({
        error: 'Amount cannot be negative'
      });
    }

    if (parseInt(month) < 1 || parseInt(month) > 12) {
      return res.status(400).json({
        error: 'Month must be between 1 and 12'
      });
    }

    if (parseInt(year) < 2000 || parseInt(year) > 2100) {
      return res.status(400).json({
        error: 'Year must be between 2000 and 2100'
      });
    }

    const expense = await Expense.create({
      description: description.trim(),
      amount: parseFloat(amount),
      month: parseInt(month),
      year: parseInt(year)
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({
      error: 'Failed to create expense'
    });
  }
};

// Update an expense
const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, amount } = req.body;

    if (!description || amount === undefined) {
      return res.status(400).json({
        error: 'Description and amount are required'
      });
    }

    if (parseFloat(amount) < 0) {
      return res.status(400).json({
        error: 'Amount cannot be negative'
      });
    }

    const expense = await Expense.findByPk(id);
    if (!expense) {
      return res.status(404).json({
        error: 'Expense not found'
      });
    }

    await expense.update({
      description: description.trim(),
      amount: parseFloat(amount)
    });

    res.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({
      error: 'Failed to update expense'
    });
  }
};

// Delete an expense
const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findByPk(id);
    if (!expense) {
      return res.status(404).json({
        error: 'Expense not found'
      });
    }

    await expense.destroy();
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({
      error: 'Failed to delete expense'
    });
  }
};

// Get expenses summary for a month/year
const getExpensesSummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({
        error: 'Month and year are required'
      });
    }

    const expenses = await Expense.findAll({
      where: {
        month: parseInt(month),
        year: parseInt(year)
      }
    });

    const totalAmount = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    const count = expenses.length;

    res.json({
      totalAmount,
      count,
      expenses
    });
  } catch (error) {
    console.error('Error fetching expenses summary:', error);
    res.status(500).json({
      error: 'Failed to fetch expenses summary'
    });
  }
};

module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpensesSummary
};
