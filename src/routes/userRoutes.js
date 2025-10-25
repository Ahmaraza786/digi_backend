const express = require('express');
const { 
  getAllUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  deleteUser,
  getUsersWithPagination
} = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/users (with pagination - for frontend)
router.get('/', getUsersWithPagination);

// GET /api/users/all (get all users without pagination)
router.get('/all', getAllUsers);

// GET /api/users/:id
router.get('/:id', getUserById);

// POST /api/users
router.post('/', createUser);

// PUT /api/users/:id
router.put('/:id', updateUser);

// DELETE /api/users/:id
router.delete('/:id', deleteUser);

module.exports = router;
