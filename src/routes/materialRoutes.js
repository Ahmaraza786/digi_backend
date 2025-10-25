const express = require('express');
const { 
  getAllMaterials, 
  getMaterialById, 
  createMaterial, 
  updateMaterial, 
  deleteMaterial,
  getMaterialsWithPagination
} = require('../controllers/materialController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/materials (with pagination - for frontend)
router.get('/', getMaterialsWithPagination);

// GET /api/materials/all (get all materials without pagination)
router.get('/all', getAllMaterials);

// GET /api/materials/:id
router.get('/:id', getMaterialById);

// POST /api/materials
router.post('/', createMaterial);

// PUT /api/materials/:id
router.put('/:id', updateMaterial);

// DELETE /api/materials/:id
router.delete('/:id', deleteMaterial);

module.exports = router;
