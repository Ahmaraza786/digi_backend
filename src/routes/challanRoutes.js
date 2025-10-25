const express = require('express');
const router = express.Router();
const challanController = require('../controllers/challanController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get available materials for a purchase order
router.get('/purchase-order/:purchaseOrderId/materials', challanController.getAvailableMaterials);

// Get challan history for a purchase order
router.get('/purchase-order/:purchaseOrderId/history', challanController.getChallanHistory);

// Get all challans with pagination and filters
router.get('/', challanController.getAllChallans);

// Get single challan by ID
router.get('/:id', challanController.getChallanById);

// Create a new challan
router.post('/', challanController.createChallan);

// Delete challan
router.delete('/:id', challanController.deleteChallan);

module.exports = router;
