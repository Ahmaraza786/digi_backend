const { Invoice, Customer, User, PurchaseOrder, Quotation, Material, Tax } = require('../models');
const { Op } = require('sequelize');

// Helper function to calculate cheque amount based on tax
const calculateChequeAmount = async (totalAmount, invoiceType, withHoldTax) => {
  if (!withHoldTax) {
    return parseFloat(totalAmount); // No tax, return original amount
  }

  try {
    // Get tax rate from taxes table based on invoice type
    const taxRecord = await Tax.findOne({
      where: { service_type: invoiceType }
    });

    if (!taxRecord) {
      console.log(`No tax record found for ${invoiceType}, using 0% tax`);
      return parseFloat(totalAmount); // No tax record found, return original amount
    }

    const taxRate = parseFloat(taxRecord.tax_percent);
    const taxAmount = (parseFloat(totalAmount) * taxRate) / 100;
    const chequeAmount = parseFloat(totalAmount) + taxAmount;

    console.log(`Tax calculation: Amount=${totalAmount}, Type=${invoiceType}, TaxRate=${taxRate}%, TaxAmount=${taxAmount}, ChequeAmount=${chequeAmount}`);
    
    return chequeAmount;
  } catch (error) {
    console.error('Error calculating tax:', error);
    return parseFloat(totalAmount); // Fallback to original amount on error
  }
};

// Get invoices with pagination and search functionality
const getInvoicesWithPagination = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const size = parseInt(req.query.size) || 10;
    const offset = page * size;

    // Search parameters
    const { search, customer_id, customer, status, invoice_type, quotation_id, purchase_order_id, startDate, endDate } = req.query;
    let whereClause = {};
    let includeConditions = [];

    // Build search conditions
    if (customer_id) {
      whereClause.customer_id = customer_id;
    }

    // Handle customer name search
    if (customer) {
      includeConditions.push({
        model: Customer,
        as: 'customer',
        where: {
          customer_name: { [Op.iLike]: `%${customer}%` }
        },
        attributes: ['id', 'customer_name', 'company_name', 'telephone_number']
      });
    }

    if (status) {
      whereClause.status = status;
    }

    if (invoice_type) {
      whereClause.invoice_type = invoice_type;
    }

    if (quotation_id) {
      whereClause.quotation_id = quotation_id;
    }

    if (purchase_order_id) {
      whereClause.purchase_order_id = purchase_order_id;
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
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Log the final whereClause for debugging
    console.log('🔍 Final whereClause:', JSON.stringify(whereClause, null, 2));

    // Build include array
    const includeArray = [
      {
        model: Customer,
        as: 'customer',
        attributes: ['id', 'customer_name', 'company_name', 'telephone_number'],
        ...(customer ? includeConditions[0] : {})
      },
      {
        model: PurchaseOrder,
        as: 'purchaseOrder',
        attributes: ['id', 'purchase_order_no', 'customer', 'status']
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
    ];

    const { count, rows } = await Invoice.findAndCountAll({
      where: whereClause,
      include: includeArray,
      order: [['created_at', 'DESC']],
      limit: size,
      offset: offset
    });

    // Transform customer and purchase order data to match frontend expectations
    const transformedRows = rows.map(invoice => ({
      ...invoice.toJSON(),
      customer: invoice.customer ? {
        id: invoice.customer.id,
        customerName: invoice.customer.customer_name,
        companyName: invoice.customer.company_name,
        telephoneNumber: invoice.customer.telephone_number
      } : null,
      purchaseOrder: invoice.purchaseOrder ? {
        id: invoice.purchaseOrder.id,
        purchase_order_no: invoice.purchaseOrder.purchase_order_no,
        customer: invoice.purchaseOrder.customer,
        status: invoice.purchaseOrder.status
      } : null
    }));

    res.json({
      content: transformedRows,
      totalElements: count,
      totalPages: Math.ceil(count / size),
      size: size,
      number: page
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all invoices without pagination
const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customer_name', 'company_name', 'telephone_number']
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

    res.json(invoices);
  } catch (error) {
    console.error('Error fetching all invoices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get purchase orders by customer ID
const getPurchaseOrdersByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    const purchaseOrders = await PurchaseOrder.findAll({
      where: { 
        customer_id: customerId // Search by customer ID
      },
      include: [
        {
          model: Quotation,
          as: 'quotation',
          attributes: ['id', 'title', 'total_price', 'status', 'materials']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Enhance materials with material_type information for all purchase orders
    for (const purchaseOrder of purchaseOrders) {
      if (purchaseOrder.quotation && purchaseOrder.quotation.materials) {
        const materialIds = purchaseOrder.quotation.materials.map(m => m.material_id);
        const materialDetails = await Material.findAll({
          where: { id: { [Op.in]: materialIds } },
          attributes: ['id', 'name', 'material_type']
        });

        // Create a map for quick lookup
        const materialMap = {};
        materialDetails.forEach(material => {
          materialMap[material.id] = material;
        });

        // Enhance materials with material_type
        purchaseOrder.quotation.materials = purchaseOrder.quotation.materials.map(material => ({
          ...material,
          material_type: materialMap[material.material_id]?.material_type || 'material'
        }));
      }
    }

    res.json({
      success: true,
      purchaseOrders: purchaseOrders
    });
  } catch (error) {
    console.error('Error fetching purchase orders by customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get purchase order details for invoice creation
const getPurchaseOrderDetails = async (req, res) => {
  try {
    const { purchaseOrderId } = req.params;
    
    if (!purchaseOrderId) {
      return res.status(400).json({ error: 'Purchase Order ID is required' });
    }

    const purchaseOrder = await PurchaseOrder.findByPk(purchaseOrderId, {
      include: [
        {
          model: Quotation,
          as: 'quotation',
          attributes: ['id', 'title', 'total_price', 'status', 'materials']
        }
      ]
    });

    if (!purchaseOrder) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    // Enhance materials with material_type information
    if (purchaseOrder.quotation && purchaseOrder.quotation.materials) {
      const materialIds = purchaseOrder.quotation.materials.map(m => m.material_id);
      const materialDetails = await Material.findAll({
        where: { id: { [Op.in]: materialIds } },
        attributes: ['id', 'name', 'material_type']
      });

      // Create a map for quick lookup
      const materialMap = {};
      materialDetails.forEach(material => {
        materialMap[material.id] = material;
      });

      // Enhance materials with material_type
      purchaseOrder.quotation.materials = purchaseOrder.quotation.materials.map(material => ({
        ...material,
        material_type: materialMap[material.material_id]?.material_type || 'material'
      }));
    }

    res.json({
      success: true,
      purchaseOrder: purchaseOrder
    });
  } catch (error) {
    console.error('Error fetching purchase order details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Search invoices by various criteria
const searchInvoices = async (req, res) => {
  try {
    const { search, customer_id, status, invoice_type, quotation_id, purchase_order_id, startDate, endDate } = req.query;
    let whereClause = {};

    if (customer_id) {
      whereClause.customer_id = customer_id;
    }

    if (status) {
      whereClause.status = status;
    }

    if (invoice_type) {
      whereClause.invoice_type = invoice_type;
    }

    if (quotation_id) {
      whereClause.quotation_id = quotation_id;
    }

    if (purchase_order_id) {
      whereClause.purchase_order_id = purchase_order_id;
    }

    // Date range filtering
    if (startDate || endDate) {
      console.log('📅 SearchInvoices - Date range filtering:', { startDate, endDate });
      whereClause.created_at = {};
      if (startDate) {
        const startDateObj = new Date(startDate);
        whereClause.created_at[Op.gte] = startDateObj;
        console.log('📅 SearchInvoices - Start date filter:', startDateObj);
      }
      if (endDate) {
        // Add one day to endDate to include the entire end date
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 1);
        whereClause.created_at[Op.lt] = endDateObj;
        console.log('📅 SearchInvoices - End date filter:', endDateObj);
      }
      console.log('📅 SearchInvoices - Final whereClause.created_at:', whereClause.created_at);
    }

    if (search) {
      whereClause[Op.or] = [
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const invoices = await Invoice.findAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customer_name', 'company_name', 'telephone_number']
        },
        {
          model: Quotation,
          as: 'quotation',
          attributes: ['id', 'title', 'total_price', 'status']
        },
        {
          model: PurchaseOrder,
          as: 'purchaseOrder',
          attributes: ['id', 'purchase_order_no', 'customer', 'status']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(invoices);
  } catch (error) {
    console.error('Error searching invoices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get invoice by ID
const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customer_name', 'company_name', 'telephone_number']
        },
        {
          model: Quotation,
          as: 'quotation',
          attributes: ['id', 'title', 'total_price', 'status', 'materials']
        },
        {
          model: PurchaseOrder,
          as: 'purchaseOrder',
          attributes: ['id', 'purchase_order_no', 'customer', 'status', 'description'],
          include: [
            {
              model: Quotation,
              as: 'quotation',
              attributes: ['id', 'title', 'total_price', 'status', 'materials']
            }
          ]
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

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Enhance materials with material_type information if purchase order has quotation
    if (invoice.purchaseOrder && invoice.purchaseOrder.quotation && invoice.purchaseOrder.quotation.materials) {
      const materialIds = invoice.purchaseOrder.quotation.materials.map(m => m.material_id);
      const materialDetails = await Material.findAll({
        where: { id: { [Op.in]: materialIds } },
        attributes: ['id', 'name', 'material_type']
      });

      // Create a map for quick lookup
      const materialMap = {};
      materialDetails.forEach(material => {
        materialMap[material.id] = material;
      });

      // Enhance materials with material_type
      invoice.purchaseOrder.quotation.materials = invoice.purchaseOrder.quotation.materials.map(material => ({
        ...material,
        material_type: materialMap[material.material_id]?.material_type || 'material'
      }));
    }

    // Transform customer and purchase order data to match frontend expectations
    const transformedInvoice = {
      ...invoice.toJSON(),
      customer: invoice.customer ? {
        id: invoice.customer.id,
        customerName: invoice.customer.customer_name,
        companyName: invoice.customer.company_name,
        telephoneNumber: invoice.customer.telephone_number
      } : null,
      purchaseOrder: invoice.purchaseOrder ? {
        id: invoice.purchaseOrder.id,
        purchase_order_no: invoice.purchaseOrder.purchase_order_no,
        customer: invoice.purchaseOrder.customer,
        status: invoice.purchaseOrder.status,
        description: invoice.purchaseOrder.description,
        quotation: invoice.purchaseOrder.quotation
      } : null
    };

    res.json(transformedInvoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new invoice
const createInvoice = async (req, res) => {
  try {
    const { 
      customer_id, 
      quotation_id, 
      purchase_order_id, 
      status, 
      total_amount, 
      tax_deducted, 
      invoice_type, 
      description,
      with_hold_tax,
      cheque_amount,
      voucher_no,
      bank,
      deposit_date,
      dw_bank
    } = req.body;
    const created_by = req.user.id; // From authenticated user

    // Validate customer exists
    const customer = await Customer.findByPk(customer_id);
    if (!customer) {
      return res.status(400).json({ error: 'Customer not found' });
    }

    // Validate quotation if provided
    if (quotation_id) {
      const quotation = await Quotation.findByPk(quotation_id);
      if (!quotation) {
        return res.status(400).json({ error: 'Quotation not found' });
      }
    }

    // Validate purchase order if provided
    if (purchase_order_id) {
      const purchaseOrder = await PurchaseOrder.findByPk(purchase_order_id);
      if (!purchaseOrder) {
        return res.status(400).json({ error: 'Purchase order not found' });
      }
    }

    // Calculate cheque_amount automatically if status is 'paid'
    let calculatedChequeAmount = cheque_amount;
    if (status === 'paid') {
      calculatedChequeAmount = await calculateChequeAmount(total_amount, invoice_type, with_hold_tax);
      console.log(`Auto-calculated cheque amount for paid invoice: ${calculatedChequeAmount}`);
    }

    const invoice = await Invoice.create({
      customer_id,
      quotation_id,
      purchase_order_id,
      status: status || 'unpaid',
      total_amount,
      tax_deducted: tax_deducted || 0,
      invoice_type,
      description,
      with_hold_tax: with_hold_tax || false,
      cheque_amount: calculatedChequeAmount,
      voucher_no,
      bank,
      deposit_date,
      dw_bank,
      created_by
    });

    // Fetch the created invoice with associations
    const createdInvoice = await Invoice.findByPk(invoice.id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customer_name', 'company_name', 'telephone_number']
        },
        {
          model: Quotation,
          as: 'quotation',
          attributes: ['id', 'title', 'total_price', 'status']
        },
        {
          model: PurchaseOrder,
          as: 'purchaseOrder',
          attributes: ['id', 'purchase_order_no', 'customer', 'status']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    // Transform customer and purchase order data to match frontend expectations
    const transformedInvoice = {
      ...createdInvoice.toJSON(),
      customer: createdInvoice.customer ? {
        id: createdInvoice.customer.id,
        customerName: createdInvoice.customer.customer_name,
        companyName: createdInvoice.customer.company_name,
        telephoneNumber: createdInvoice.customer.telephone_number
      } : null,
      purchaseOrder: createdInvoice.purchaseOrder ? {
        id: createdInvoice.purchaseOrder.id,
        purchase_order_no: createdInvoice.purchaseOrder.purchase_order_no,
        customer: createdInvoice.purchaseOrder.customer,
        status: createdInvoice.purchaseOrder.status
      } : null
    };

    res.status(201).json(transformedInvoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update invoice
const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      customer_id, 
      quotation_id, 
      purchase_order_id, 
      status, 
      total_amount, 
      tax_deducted, 
      invoice_type, 
      description,
      with_hold_tax,
      cheque_amount,
      voucher_no,
      bank,
      deposit_date,
      dw_bank
    } = req.body;
    const updated_by = req.user.id; // From authenticated user

    const invoice = await Invoice.findByPk(id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Validate customer if provided
    if (customer_id && customer_id !== invoice.customer_id) {
      const customer = await Customer.findByPk(customer_id);
      if (!customer) {
        return res.status(400).json({ error: 'Customer not found' });
      }
    }

    // Validate quotation if provided
    if (quotation_id && quotation_id !== invoice.quotation_id) {
      const quotation = await Quotation.findByPk(quotation_id);
      if (!quotation) {
        return res.status(400).json({ error: 'Quotation not found' });
      }
    }

    // Validate purchase order if provided
    if (purchase_order_id && purchase_order_id !== invoice.purchase_order_id) {
      const purchaseOrder = await PurchaseOrder.findByPk(purchase_order_id);
      if (!purchaseOrder) {
        return res.status(400).json({ error: 'Purchase order not found' });
      }
    }

    // Calculate cheque_amount automatically if status is being changed to 'paid'
    let calculatedChequeAmount = cheque_amount !== undefined ? cheque_amount : invoice.cheque_amount;
    const newStatus = status || invoice.status;
    const newInvoiceType = invoice_type || invoice.invoice_type;
    const newWithHoldTax = with_hold_tax !== undefined ? with_hold_tax : invoice.with_hold_tax;
    const newTotalAmount = total_amount || invoice.total_amount;

    if (newStatus === 'paid') {
      calculatedChequeAmount = await calculateChequeAmount(newTotalAmount, newInvoiceType, newWithHoldTax);
      console.log(`Auto-calculated cheque amount for updated paid invoice: ${calculatedChequeAmount}`);
    }

    await invoice.update({
      customer_id: customer_id || invoice.customer_id,
      quotation_id: quotation_id !== undefined ? quotation_id : invoice.quotation_id,
      purchase_order_id: purchase_order_id !== undefined ? purchase_order_id : invoice.purchase_order_id,
      status: newStatus,
      total_amount: newTotalAmount,
      tax_deducted: tax_deducted !== undefined ? tax_deducted : invoice.tax_deducted,
      invoice_type: newInvoiceType,
      description: description !== undefined ? description : invoice.description,
      with_hold_tax: newWithHoldTax,
      cheque_amount: calculatedChequeAmount,
      voucher_no: voucher_no !== undefined ? voucher_no : invoice.voucher_no,
      bank: bank !== undefined ? bank : invoice.bank,
      deposit_date: deposit_date !== undefined ? deposit_date : invoice.deposit_date,
      dw_bank: dw_bank !== undefined ? dw_bank : invoice.dw_bank,
      updated_by
    });

    // Fetch the updated invoice with associations
    const updatedInvoice = await Invoice.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customer_name', 'company_name', 'telephone_number']
        },
        {
          model: Quotation,
          as: 'quotation',
          attributes: ['id', 'title', 'total_price', 'status']
        },
        {
          model: PurchaseOrder,
          as: 'purchaseOrder',
          attributes: ['id', 'purchase_order_no', 'customer', 'status']
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

    // Transform customer and purchase order data to match frontend expectations
    const transformedInvoice = {
      ...updatedInvoice.toJSON(),
      customer: updatedInvoice.customer ? {
        id: updatedInvoice.customer.id,
        customerName: updatedInvoice.customer.customer_name,
        companyName: updatedInvoice.customer.company_name,
        telephoneNumber: updatedInvoice.customer.telephone_number
      } : null,
      purchaseOrder: updatedInvoice.purchaseOrder ? {
        id: updatedInvoice.purchaseOrder.id,
        purchase_order_no: updatedInvoice.purchaseOrder.purchase_order_no,
        customer: updatedInvoice.purchaseOrder.customer,
        status: updatedInvoice.purchaseOrder.status
      } : null
    };

    res.json(transformedInvoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete invoice
const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findByPk(id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    await invoice.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoicesWithPagination,
  searchInvoices,
  getPurchaseOrdersByCustomer,
  getPurchaseOrderDetails
};
