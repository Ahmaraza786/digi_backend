const { PurchaseOrder, Quotation, User, PurchaseOrderFile } = require('../models');
const { Op } = require('sequelize');
const AWS = require('aws-sdk');

// Configure AWS S3 for presigned URLs
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_ID,
  region: process.env.AWS_REGION || 'us-east-1'
});

const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  signatureVersion: 'v4'
});

// Get purchase orders with pagination and search functionality
const getPurchaseOrdersWithPagination = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const size = parseInt(req.query.size) || 10;
    const offset = page * size;

    // Search parameters
    const { search, purchase_order_id, customer, status, quotation_id, startDate, endDate } = req.query;
    let whereClause = {};

    // Build search conditions
    if (purchase_order_id) {
      whereClause.id = purchase_order_id;
    }

    if (customer) {
      whereClause.customer = { [Op.iLike]: `%${customer}%` };
    }

    if (status) {
      whereClause.status = status;
    }

    if (quotation_id) {
      whereClause.quotation_id = quotation_id;
    }

    // Date range filtering
    if (startDate || endDate) {
      console.log('📅 Date range filtering:', { startDate, endDate });
      whereClause.created_at = {};
      if (startDate) {
        const startDateObj = new Date(startDate);
        whereClause.created_at[Op.gte] = startDateObj;
        console.log('📅 Start date filter:', startDateObj);
      }
      if (endDate) {
        // Add one day to endDate to include the entire end date
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 1);
        whereClause.created_at[Op.lt] = endDateObj;
        console.log('📅 End date filter:', endDateObj);
      }
      console.log('📅 Final whereClause.created_at:', whereClause.created_at);
    }

    // General search across multiple fields
    if (search) {
      whereClause[Op.or] = [
        { id: { [Op.eq]: isNaN(search) ? -1 : parseInt(search) } }, // Search by ID if numeric
        { purchase_order_no: { [Op.iLike]: `%${search}%` } },
        { customer: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await PurchaseOrder.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Quotation,
          as: 'quotation',
          attributes: ['id', 'title', 'total_price', 'status']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'username', 'email']
        },
        {
          model: PurchaseOrderFile,
          as: 'files',
          attributes: ['id', 'file_name', 'file_path', 'file_size', 'file_type', 'created_at']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: size,
      offset: offset
    });

    res.json({
      content: rows,
      totalElements: count,
      totalPages: Math.ceil(count / size),
      size: size,
      number: page
    });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all purchase orders without pagination
const getAllPurchaseOrders = async (req, res) => {
  try {
    const purchaseOrders = await PurchaseOrder.findAll({
      include: [
        {
          model: Quotation,
          as: 'quotation',
          attributes: ['id', 'title', 'total_price', 'status']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'username', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(purchaseOrders);
  } catch (error) {
    console.error('Error fetching all purchase orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Search purchase orders by various criteria
const searchPurchaseOrders = async (req, res) => {
  try {
    const { search, customer, status, quotation_id, startDate, endDate } = req.query;
    let whereClause = {};

    if (customer) {
      whereClause.customer = { [Op.iLike]: `%${customer}%` };
    }

    if (status) {
      whereClause.status = status;
    }

    if (quotation_id) {
      whereClause.quotation_id = quotation_id;
    }

    // Date range filtering
    if (startDate || endDate) {
      console.log('📅 Date range filtering:', { startDate, endDate });
      whereClause.created_at = {};
      if (startDate) {
        const startDateObj = new Date(startDate);
        whereClause.created_at[Op.gte] = startDateObj;
        console.log('📅 Start date filter:', startDateObj);
      }
      if (endDate) {
        // Add one day to endDate to include the entire end date
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 1);
        whereClause.created_at[Op.lt] = endDateObj;
        console.log('📅 End date filter:', endDateObj);
      }
      console.log('📅 Final whereClause.created_at:', whereClause.created_at);
    }

    if (search) {
      whereClause[Op.or] = [
        { purchase_order_no: { [Op.iLike]: `%${search}%` } },
        { customer: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const purchaseOrders = await PurchaseOrder.findAll({
      where: whereClause,
      include: [
        {
          model: Quotation,
          as: 'quotation',
          attributes: ['id', 'title', 'total_price', 'status']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(purchaseOrders);
  } catch (error) {
    console.error('Error searching purchase orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get purchase order by ID
const getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const purchaseOrder = await PurchaseOrder.findByPk(id, {
      include: [
        {
          model: Quotation,
          as: 'quotation',
          attributes: ['id', 'title', 'total_price', 'status', 'materials']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    if (!purchaseOrder) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    // Enhance materials with actual costs from material_costs if available
    if (purchaseOrder.quotation && purchaseOrder.quotation.materials && purchaseOrder.material_costs) {
      purchaseOrder.quotation.materials = purchaseOrder.quotation.materials.map((material, index) => ({
        ...material,
        actual_cost: purchaseOrder.material_costs[index] || 0
      }));
    }

    res.json(purchaseOrder);
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new purchase order
const createPurchaseOrder = async (req, res) => {
  try {
    const { purchase_order_no, customer, customer_id, description, status, quotation_id, material_costs } = req.body;
    const created_by = req.user.id; // From authenticated user

    // Check if purchase order number already exists
    const existingPO = await PurchaseOrder.findOne({
      where: { purchase_order_no }
    });

    if (existingPO) {
      return res.status(400).json({ error: 'Purchase order number already exists' });
    }

    // Validate quotation_id if provided and update quotation status
    if (quotation_id) {
      const quotation = await Quotation.findByPk(quotation_id);
      if (!quotation) {
        return res.status(400).json({ error: 'Quotation not found' });
      }
      
      // Update quotation status to 'po_received' when PO is created against it
      await quotation.update({
        status: 'po_received',
        updated_by: created_by
      });
      
      console.log(`Quotation ${quotation_id} status updated to 'po_received' due to purchase order creation`);
    }

    const purchaseOrder = await PurchaseOrder.create({
      purchase_order_no,
      customer,
      customer_id: customer_id && customer_id !== '' ? parseInt(customer_id) : null,
      description,
      status: status || 'pending',
      quotation_id: quotation_id && quotation_id !== '' ? parseInt(quotation_id) : null,
      material_costs: material_costs ? JSON.parse(material_costs) : null,
      created_by
    });

    // Handle multiple file uploads
    if (req.files && req.files.length > 0) {
      const filePromises = req.files.map(file => {
        return PurchaseOrderFile.create({
          purchase_order_id: purchaseOrder.id,
          file_name: file.originalname,
          file_path: file.location,
          file_size: file.size,
          file_type: file.mimetype,
          uploaded_by: created_by
        });
      });
      
      await Promise.all(filePromises);
    }

    // Fetch the created purchase order with associations
    const createdPurchaseOrder = await PurchaseOrder.findByPk(purchaseOrder.id, {
      include: [
        {
          model: Quotation,
          as: 'quotation',
          attributes: ['id', 'title', 'total_price', 'status', 'materials']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        },
        {
          model: PurchaseOrderFile,
          as: 'files',
          attributes: ['id', 'file_name', 'file_path', 'file_size', 'file_type', 'created_at']
        }
      ]
    });

    // Enhance materials with actual costs from material_costs if available
    if (createdPurchaseOrder.quotation && createdPurchaseOrder.quotation.materials && createdPurchaseOrder.material_costs) {
      createdPurchaseOrder.quotation.materials = createdPurchaseOrder.quotation.materials.map((material, index) => ({
        ...material,
        actual_cost: createdPurchaseOrder.material_costs[index] || 0
      }));
    }

    res.status(201).json(createdPurchaseOrder);
  } catch (error) {
    console.error('Error creating purchase order:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update purchase order
const updatePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { purchase_order_no, customer, customer_id, description, status, quotation_id, material_costs } = req.body;
    const updated_by = req.user.id; // From authenticated user

    const purchaseOrder = await PurchaseOrder.findByPk(id);
    if (!purchaseOrder) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    // Check if purchase order number already exists (excluding current record)
    if (purchase_order_no && purchase_order_no !== purchaseOrder.purchase_order_no) {
      const existingPO = await PurchaseOrder.findOne({
        where: { 
          purchase_order_no,
          id: { [Op.ne]: id }
        }
      });

      if (existingPO) {
        return res.status(400).json({ error: 'Purchase order number already exists' });
      }
    }

    // Handle quotation status changes
    const oldQuotationId = purchaseOrder.quotation_id;
    const newQuotationId = quotation_id !== undefined ? (quotation_id && quotation_id !== '' ? parseInt(quotation_id) : null) : purchaseOrder.quotation_id;
    
    // If quotation changed, handle status updates
    if (oldQuotationId !== newQuotationId) {
      // Revert old quotation status to 'pending' if it exists
      if (oldQuotationId) {
        const oldQuotation = await Quotation.findByPk(oldQuotationId);
        if (oldQuotation) {
          await oldQuotation.update({
            status: 'pending',
            updated_by: updated_by
          });
          console.log(`Quotation ${oldQuotationId} status reverted to 'pending' due to purchase order update`);
        }
      }
      
      // Update new quotation status to 'po_received' if it exists
      if (newQuotationId) {
        const newQuotation = await Quotation.findByPk(newQuotationId);
        if (!newQuotation) {
          return res.status(400).json({ error: 'Quotation not found' });
        }
        
        await newQuotation.update({
          status: 'po_received',
          updated_by: updated_by
        });
        console.log(`Quotation ${newQuotationId} status updated to 'po_received' due to purchase order update`);
      }
    }

    await purchaseOrder.update({
      purchase_order_no: purchase_order_no || purchaseOrder.purchase_order_no,
      customer: customer || purchaseOrder.customer,
      customer_id: customer_id !== undefined ? (customer_id && customer_id !== '' ? parseInt(customer_id) : null) : purchaseOrder.customer_id,
      description: description !== undefined ? description : purchaseOrder.description,
      status: status || purchaseOrder.status,
      quotation_id: newQuotationId,
      material_costs: material_costs !== undefined ? (material_costs ? JSON.parse(material_costs) : null) : purchaseOrder.material_costs,
      updated_by
    });

    // Handle multiple file uploads (add new files)
    if (req.files && req.files.length > 0) {
      const filePromises = req.files.map(file => {
        return PurchaseOrderFile.create({
          purchase_order_id: purchaseOrder.id,
          file_name: file.originalname,
          file_path: file.location,
          file_size: file.size,
          file_type: file.mimetype,
          uploaded_by: updated_by
        });
      });
      
      await Promise.all(filePromises);
    }

    // Fetch the updated purchase order with associations
    const updatedPurchaseOrder = await PurchaseOrder.findByPk(id, {
      include: [
        {
          model: Quotation,
          as: 'quotation',
          attributes: ['id', 'title', 'total_price', 'status', 'materials']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'username', 'email']
        },
        {
          model: PurchaseOrderFile,
          as: 'files',
          attributes: ['id', 'file_name', 'file_path', 'file_size', 'file_type', 'created_at']
        }
      ]
    });

    // Enhance materials with actual costs from material_costs if available
    if (updatedPurchaseOrder.quotation && updatedPurchaseOrder.quotation.materials && updatedPurchaseOrder.material_costs) {
      updatedPurchaseOrder.quotation.materials = updatedPurchaseOrder.quotation.materials.map((material, index) => ({
        ...material,
        actual_cost: updatedPurchaseOrder.material_costs[index] || 0
      }));
    }

    res.json(updatedPurchaseOrder);
  } catch (error) {
    console.error('Error updating purchase order:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete purchase order
const deletePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const purchaseOrder = await PurchaseOrder.findByPk(id);
    if (!purchaseOrder) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    // Revert quotation status to 'pending' if purchase order has a quotation
    if (purchaseOrder.quotation_id) {
      const quotation = await Quotation.findByPk(purchaseOrder.quotation_id);
      if (quotation) {
        await quotation.update({
          status: 'pending',
          updated_by: req.user.id
        });
        console.log(`Quotation ${purchaseOrder.quotation_id} status reverted to 'pending' due to purchase order deletion`);
      }
    }

    await purchaseOrder.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Generate presigned URL for file access
const generatePresignedUrl = async (req, res) => {
  try {
    const { id, fileId } = req.params;
    
    // Get the purchase order
    const purchaseOrder = await PurchaseOrder.findByPk(id);
    if (!purchaseOrder) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    // Get the specific file
    const file = await PurchaseOrderFile.findOne({
      where: {
        id: fileId,
        purchase_order_id: id
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found for this purchase order' });
    }

    // Extract the S3 key from the file path
    const fileUrl = file.file_path;
    const urlParts = fileUrl.split('/');
    const bucketName = urlParts[2].split('.')[0]; // Extract bucket name from URL
    const key = urlParts.slice(3).join('/'); // Everything after bucket name

    // Generate presigned URL (valid for 5 minutes)
    const presignedUrl = s3.getSignedUrl('getObject', {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Expires: 300 // 5 minutes in seconds
    });

    res.json({
      success: true,
      presignedUrl: presignedUrl,
      expiresIn: 300,
      message: 'Presigned URL generated successfully'
    });

  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  getPurchaseOrdersWithPagination,
  searchPurchaseOrders,
  generatePresignedUrl
};
