const { Challan, PurchaseOrder, Quotation, Customer, User } = require('../models');
const { Op } = require('sequelize');

// Generate unique challan number
const generateChallanNumber = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `DC-${currentYear}-`;
  
  // Find the highest existing challan number for this year
  const lastChallan = await Challan.findOne({
    where: {
      challan_no: {
        [Op.like]: `${prefix}%`
      }
    },
    order: [['challan_no', 'DESC']]
  });
  
  let nextNumber = 1;
  if (lastChallan) {
    const lastNumber = parseInt(lastChallan.challan_no.replace(prefix, ''));
    nextNumber = lastNumber + 1;
  }
  
  return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
};

// Get available materials for a purchase order
const getAvailableMaterials = async (req, res) => {
  try {
    const { purchaseOrderId } = req.params;
    
    // Get purchase order with quotation
    const purchaseOrder = await PurchaseOrder.findByPk(purchaseOrderId, {
      include: [
        {
          model: Quotation,
          as: 'quotation',
          attributes: ['id', 'materials', 'title']
        }
      ]
    });
    
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }
    
    if (!purchaseOrder.quotation) {
      return res.status(400).json({
        success: false,
        message: 'No quotation found for this purchase order'
      });
    }
    
    // Get all previous challans for this purchase order
    const previousChallans = await Challan.findAll({
      where: { purchase_order_id: purchaseOrderId },
      attributes: ['materials']
    });
    
    // Filter out service-type materials and calculate remaining quantities
    const originalMaterials = purchaseOrder.quotation.materials;
    
    // Filter out service-type materials directly from quotation materials
    const filteredMaterials = originalMaterials.filter(material => 
      material.material_type !== 'service'
    );
    
    const remainingMaterials = filteredMaterials.map(material => {
      let totalDelivered = 0;
      
      // Sum up all delivered quantities for this material
      previousChallans.forEach(challan => {
        challan.materials.forEach(challanMaterial => {
          if (challanMaterial.material_id === material.material_id) {
            totalDelivered += parseInt(challanMaterial.quantity) || 0;
          }
        });
      });
      
      const remaining = (parseInt(material.quantity) || 0) - totalDelivered;
      
      return {
        ...material,
        original_quantity: material.quantity,
        delivered_quantity: totalDelivered,
        remaining_quantity: Math.max(0, remaining),
        can_deliver: remaining > 0
      };
    });
    
    res.json({
      success: true,
      data: {
        purchaseOrder: {
          id: purchaseOrder.id,
          purchase_order_no: purchaseOrder.purchase_order_no,
          customer: purchaseOrder.customer
        },
        customer: purchaseOrder.customerInfo,
        quotation: purchaseOrder.quotation,
        materials: remainingMaterials
      }
    });
    
  } catch (error) {
    console.error('Error getting available materials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available materials',
      error: error.message
    });
  }
};

// Create a new challan
const createChallan = async (req, res) => {
  try {
    console.log('=== CHALLAN CREATION STARTED ===');
    console.log('Request body:', req.body);
    const { purchase_order_id, materials, notes } = req.body;
    const userId = req.user.id;
    
    // Validate required fields
    if (!purchase_order_id || !materials || !Array.isArray(materials) || materials.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Purchase order ID and materials are required'
      });
    }
    
    // Get purchase order details
    const purchaseOrder = await PurchaseOrder.findByPk(purchase_order_id, {
      include: [
        {
          model: Quotation,
          as: 'quotation',
          attributes: ['id', 'materials']
        },
        {
          model: Customer,
          as: 'customerInfo',
          attributes: ['id', 'customer_name', 'company_name']
        }
      ]
    });
    
    // If quotation is not loaded, try to load it separately
    if (purchaseOrder && !purchaseOrder.quotation && purchaseOrder.quotation_id) {
      try {
        console.log('Quotation not loaded, trying to load separately for quotation_id:', purchaseOrder.quotation_id);
        const quotation = await Quotation.findByPk(purchaseOrder.quotation_id, {
          attributes: ['id', 'materials']
        });
        if (quotation) {
          purchaseOrder.quotation = quotation;
          console.log('Quotation loaded separately:', quotation);
        }
        else {
          console.log('Quotation not found with ID:', purchaseOrder.quotation_id);
        }
      } catch (quotationError) {
        console.error('Error loading quotation separately:', quotationError);
        // Don't throw, just log the error
      }
    }
    
    // If customerInfo is not loaded, try to load it separately
    if (purchaseOrder && !purchaseOrder.customerInfo && purchaseOrder.customer_id) {
      try {
        console.log('CustomerInfo not loaded, trying to load separately for customer_id:', purchaseOrder.customer_id);
        const customer = await Customer.findByPk(purchaseOrder.customer_id, {
          attributes: ['id', 'customer_name', 'company_name']
        });
        if (customer) {
          purchaseOrder.customerInfo = customer;
          console.log('Customer loaded separately:', customer);
        }
        else {
          console.log('Customer not found with ID:', purchaseOrder.customer_id);
        }
      } catch (customerError) {
        console.error('Error loading customer separately:', customerError);
        // Don't throw, just log the error
      }
    }
    
    console.log('Purchase order data:', {
      id: purchaseOrder?.id,
      quotation: purchaseOrder?.quotation,
      customerInfo: purchaseOrder?.customerInfo,
      customerId: purchaseOrder?.customer_id,
      customer: purchaseOrder?.customer,
      quotationId: purchaseOrder?.quotation?.id,
      quotationExists: !!purchaseOrder?.quotation
    });
    
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }
    
    if (!purchaseOrder.quotation || !purchaseOrder.quotation.id) {
      console.log('No quotation found for purchase order:', {
        purchaseOrderId: purchaseOrder.id,
        quotationId: purchaseOrder.quotation_id,
        quotation: purchaseOrder.quotation,
        hasQuotation: !!purchaseOrder.quotation
      });
      return res.status(400).json({
        success: false,
        message: 'No quotation found for this purchase order'
      });
    }
    
    // Validate quantities against remaining stock
    const previousChallans = await Challan.findAll({
      where: { purchase_order_id },
      attributes: ['materials']
    });
    
    const validationErrors = [];
    
    for (const material of materials) {
      const originalMaterial = purchaseOrder.quotation.materials.find(
        m => m.material_id === material.material_id
      );
      
      if (!originalMaterial) {
        validationErrors.push(`Material ${material.material_name} not found in quotation`);
        continue;
      }
      
      // Calculate already delivered quantity
      let totalDelivered = 0;
      previousChallans.forEach(challan => {
        challan.materials.forEach(challanMaterial => {
          if (challanMaterial.material_id === material.material_id) {
            totalDelivered += parseInt(challanMaterial.quantity) || 0;
          }
        });
      });
      
      const remaining = (parseInt(originalMaterial.quantity) || 0) - totalDelivered;
      const requestedQuantity = parseInt(material.quantity) || 0;
      
      if (requestedQuantity > remaining) {
        validationErrors.push(
          `Cannot deliver ${requestedQuantity} units of ${material.material_name}. Only ${remaining} units remaining.`
        );
      }
      
      if (requestedQuantity <= 0) {
        validationErrors.push(
          `Quantity for ${material.material_name} must be greater than 0`
        );
      }
    }
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: validationErrors
      });
    }
    
    // Generate challan number
    const challanNo = await generateChallanNumber();
    
    console.log('Creating challan with data:', {
      challan_no: challanNo,
      purchase_order_id,
      quotation_id: purchaseOrder.quotation?.id,
      customer_id: purchaseOrder.customerInfo?.id,
      customer_name: purchaseOrder.customerInfo?.customer_name,
      materials: materials.length
    });
    
    // Handle customer info - if not loaded, try to find customer by name
    let customerId = null;
    let customerName = 'Unknown Customer';
    
    if (purchaseOrder.customerInfo && purchaseOrder.customerInfo.id) {
      customerId = purchaseOrder.customerInfo.id;
      customerName = purchaseOrder.customerInfo.customer_name || purchaseOrder.customer || 'Unknown Customer';
    } else {
      // Try to find customer by name if customer_id is null
      customerName = purchaseOrder.customer || 'Unknown Customer';
      console.log('CustomerInfo not loaded, trying to find customer by name:', customerName);
      
      try {
        const customer = await Customer.findOne({
          where: {
            customer_name: customerName
          },
          attributes: ['id', 'customer_name']
        });
        
        if (customer) {
          customerId = customer.id;
          console.log('Found customer by name:', { id: customer.id, name: customer.customer_name });
        } else {
          console.log('Customer not found by name, creating default customer');
          // Create a default customer if none exists
          const defaultCustomer = await Customer.create({
            customer_name: customerName,
            company_name: 'Unknown Company',
            telephone_number: 'N/A',
            email: 'unknown@example.com',
            address: 'Unknown Address',
            created_by: userId
          });
          customerId = defaultCustomer.id;
          console.log('Created default customer:', { id: defaultCustomer.id, name: defaultCustomer.customer_name });
        }
      } catch (findCustomerError) {
        console.error('Error finding customer by name:', findCustomerError);
        // If we can't find or create a customer, we need to return an error
        return res.status(400).json({
          success: false,
          message: 'Unable to find or create customer for challan',
          error: 'Customer information is required for challan creation'
        });
      }
    }
    
    console.log('Using customer data:', { customerId, customerName });
    
    // Final check - ensure we have a valid customer_id
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required for challan creation',
        error: 'Unable to determine customer for this purchase order'
      });
    }
    
    // Create challan
    let challan;
    try {
      challan = await Challan.create({
        challan_no: challanNo,
        purchase_order_id,
        quotation_id: purchaseOrder.quotation.id,
        customer_id: customerId,
        customer_name: customerName,
        materials,
        challan_date: new Date().toISOString().split('T')[0],
        notes: notes || null,
        created_by: userId
      });
    } catch (createError) {
      console.error('Error creating challan:', createError);
      console.error('Challan data:', {
        challan_no: challanNo,
        purchase_order_id,
        quotation_id: purchaseOrder.quotation?.id,
        customer_id: customerId,
        customer_name: customerName,
        materials: materials.length
      });
      throw createError;
    }
    
    res.status(201).json({
      success: true,
      message: 'Challan created successfully',
      data: challan
    });
    
  } catch (error) {
    console.error('Error creating challan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create challan',
      error: error.message
    });
  }
};

// Get challan history for a purchase order
const getChallanHistory = async (req, res) => {
  try {
    const { purchaseOrderId } = req.params;
    
    const challans = await Challan.findAll({
      where: { purchase_order_id: purchaseOrderId },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    // Calculate summary statistics
    const summary = {
      total_challans: challans.length,
      total_quantity_delivered: 0,
      materials_summary: {}
    };
    
    challans.forEach(challan => {
      challan.materials.forEach(material => {
        const materialId = material.material_id;
        const quantity = parseInt(material.quantity) || 0;
        
        summary.total_quantity_delivered += quantity;
        
        if (!summary.materials_summary[materialId]) {
          summary.materials_summary[materialId] = {
            material_name: material.material_name,
            total_delivered: 0
          };
        }
        summary.materials_summary[materialId].total_delivered += quantity;
      });
    });
    
    res.json({
      success: true,
      data: {
        challans,
        summary
      }
    });
    
  } catch (error) {
    console.error('Error getting challan history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get challan history',
      error: error.message
    });
  }
};

// Get all challans with pagination
const getAllChallans = async (req, res) => {
  try {
    const { page = 1, size = 10, search, startDate, endDate } = req.query;
    const offset = (page - 1) * size;
    
    const whereClause = {};
    
    // Add search filter
    if (search) {
      whereClause[Op.or] = [
        { challan_no: { [Op.like]: `%${search}%` } },
        { customer_name: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // Add date range filter
    if (startDate && endDate) {
      whereClause.challan_date = {
        [Op.between]: [startDate, endDate]
      };
    }
    
    const { count, rows: challans } = await Challan.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: PurchaseOrder,
          as: 'purchaseOrder',
          attributes: ['id', 'purchase_order_no']
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customer_name', 'company_name']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(size),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      content: challans,
      totalElements: count,
      totalPages: Math.ceil(count / size),
      currentPage: parseInt(page),
      size: parseInt(size)
    });
    
  } catch (error) {
    console.error('Error getting all challans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get challans',
      error: error.message
    });
  }
};

// Get single challan by ID
const getChallanById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const challan = await Challan.findByPk(id, {
      include: [
        {
          model: PurchaseOrder,
          as: 'purchaseOrder',
          attributes: ['id', 'purchase_order_no', 'customer']
        },
        {
          model: Quotation,
          as: 'quotation',
          attributes: ['id', 'title', 'materials']
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customer_name', 'company_name', 'telephone_number', 'address']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        }
      ]
    });
    
    if (!challan) {
      return res.status(404).json({
        success: false,
        message: 'Challan not found'
      });
    }
    
    res.json({
      success: true,
      data: challan
    });
    
  } catch (error) {
    console.error('Error getting challan by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get challan',
      error: error.message
    });
  }
};

// Delete challan
const deleteChallan = async (req, res) => {
  try {
    const { id } = req.params;
    
    const challan = await Challan.findByPk(id);
    
    if (!challan) {
      return res.status(404).json({
        success: false,
        message: 'Challan not found'
      });
    }
    
    await challan.destroy();
    
    res.json({
      success: true,
      message: 'Challan deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting challan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete challan',
      error: error.message
    });
  }
};

module.exports = {
  getAvailableMaterials,
  createChallan,
  getChallanHistory,
  getAllChallans,
  getChallanById,
  deleteChallan
};
