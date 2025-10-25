const express = require('express');
const { 
  getAllPurchaseOrders, 
  getPurchaseOrderById, 
  createPurchaseOrder, 
  updatePurchaseOrder, 
  deletePurchaseOrder,
  getPurchaseOrdersWithPagination,
  searchPurchaseOrders,
  generatePresignedUrl
} = require('../controllers/purchaseOrderController');
const { authenticateToken } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/fileUpload');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/purchase-orders (with pagination - for frontend)
router.get('/', getPurchaseOrdersWithPagination);

// GET /api/purchase-orders/all (get all purchase orders without pagination)
router.get('/all', getAllPurchaseOrders);

// GET /api/purchase-orders/search (search purchase orders by various criteria)
router.get('/search', searchPurchaseOrders);

// GET /api/purchase-orders/:id
router.get('/:id', getPurchaseOrderById);

// GET /api/purchase-orders/:id/file-url/:fileId (generate presigned URL for specific file)
router.get('/:id/file-url/:fileId', generatePresignedUrl);

// POST /api/purchase-orders (with multiple file upload support)
router.post('/', upload.array('purchase_order_files', 10), handleUploadError, createPurchaseOrder);

// PUT /api/purchase-orders/:id (with multiple file upload support)
router.put('/:id', upload.array('purchase_order_files', 10), handleUploadError, updatePurchaseOrder);

// DELETE /api/purchase-orders/:id
router.delete('/:id', deletePurchaseOrder);

module.exports = router;
