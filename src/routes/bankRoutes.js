const express = require('express');
const router = express.Router();
const {
  getAllBanks,
  getBankById,
  createBank,
  updateBank,
  deleteBank,
  searchBanks
} = require('../controllers/bankController');
const auth = require('../middleware/auth');

// Apply authentication middleware to all routes
// Note: Individual routes will handle auth as needed

// GET /api/banks - Get all banks
router.get('/', getAllBanks);

// GET /api/banks/search - Search banks (for autocomplete)
router.get('/search', searchBanks);

// GET /api/banks/:id - Get bank by ID
router.get('/:id', getBankById);

// POST /api/banks - Create new bank
router.post('/', createBank);

// PUT /api/banks/:id - Update bank
router.put('/:id', updateBank);

// DELETE /api/banks/:id - Delete bank
router.delete('/:id', deleteBank);

module.exports = router;
