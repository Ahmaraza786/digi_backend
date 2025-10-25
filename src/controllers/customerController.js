const { Customer, CustomerMaterialPrice, Material } = require('../models');
const { Op } = require('sequelize');

// Get customers with pagination (for frontend)
const getCustomersWithPagination = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const size = parseInt(req.query.size) || 10;
    const offset = page * size;

    // Optional filters
    const { search } = req.query;
    let whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { customer_name: { [Op.iLike]: `%${search}%` } },
        { company_name: { [Op.iLike]: `%${search}%` } },
        { telephone_number: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Customer.findAndCountAll({
      where: whereClause,
      limit: size,
      offset: offset,
      order: [['id', 'ASC']]
    });

    // Transform data to match frontend expectations
    const transformedCustomers = rows.map(customer => ({
      id: customer.id,
      customerName: customer.customer_name,
      companyName: customer.company_name,
      address: customer.address,
      companyAddress: customer.company_address,
      telephoneNumber: customer.telephone_number,
      fax: customer.fax,
      ntn: customer.ntn,
      createdAt: customer.created_at,
      updatedAt: customer.updated_at
    }));

    res.json({
      success: true,
      customers: transformedCustomers,
      totalCount: count,
      page: page,
      size: size,
      totalPages: Math.ceil(count / size)
    });
  } catch (error) {
    console.error('Get customers with pagination error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all customers without pagination
const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.findAll({
      order: [['id', 'ASC']]
    });

    // Transform data to match frontend expectations
    const transformedCustomers = customers.map(customer => ({
      id: customer.id,
      customerName: customer.customer_name,
      companyName: customer.company_name,
      address: customer.address,
      companyAddress: customer.company_address,
      telephoneNumber: customer.telephone_number,
      fax: customer.fax,
      ntn: customer.ntn,
      createdAt: customer.created_at,
      updatedAt: customer.updated_at
    }));

    res.json(transformedCustomers);
  } catch (error) {
    console.error('Get all customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get customer by ID
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const customer = await Customer.findByPk(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: customer.id,
        customerName: customer.customer_name,
        companyName: customer.company_name,
        address: customer.address,
        companyAddress: customer.company_address,
        telephoneNumber: customer.telephone_number,
        fax: customer.fax,
        ntn: customer.ntn,
        createdAt: customer.created_at,
        updatedAt: customer.updated_at
      },
      message: 'Customer retrieved successfully'
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create new customer
const createCustomer = async (req, res) => {
  try {
    const { customerName, companyName, address, companyAddress, telephoneNumber, fax, ntn } = req.body;

    // Validate required fields
    if (!customerName) {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required'
      });
    }

    // Check if customer with same name already exists
    const existingCustomer = await Customer.findOne({
      where: { customer_name: { [Op.iLike]: customerName } }
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this name already exists'
      });
    }

    // Create customer
    const customer = await Customer.create({
      customer_name: customerName,
      company_name: companyName || null,
      address: address || null,
      company_address: companyAddress || null,
      telephone_number: telephoneNumber || null,
      fax: fax || null,
      ntn: ntn || null
    });

    res.status(201).json({
      success: true,
      data: {
        id: customer.id,
        customerName: customer.customer_name,
        companyName: customer.company_name,
        address: customer.address,
        companyAddress: customer.company_address,
        telephoneNumber: customer.telephone_number,
        fax: customer.fax,
        ntn: customer.ntn,
        createdAt: customer.created_at,
        updatedAt: customer.updated_at
      },
      message: 'Customer created successfully'
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update customer
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { customerName, companyName, address, companyAddress, telephoneNumber, fax, ntn } = req.body;

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check if name is being changed and if it conflicts with existing customer
    if (customerName && customerName !== customer.customer_name) {
      const existingCustomer = await Customer.findOne({
        where: { 
          customer_name: { [Op.iLike]: customerName },
          id: { [Op.ne]: id }
        }
      });

      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: 'Customer with this name already exists'
        });
      }
    }

    // Update customer
    await customer.update({
      customer_name: customerName || customer.customer_name,
      company_name: companyName !== undefined ? companyName : customer.company_name,
      address: address !== undefined ? address : customer.address,
      company_address: companyAddress !== undefined ? companyAddress : customer.company_address,
      telephone_number: telephoneNumber !== undefined ? telephoneNumber : customer.telephone_number,
      fax: fax !== undefined ? fax : customer.fax,
      ntn: ntn !== undefined ? ntn : customer.ntn
    });

    res.json({
      success: true,
      data: {
        id: customer.id,
        customerName: customer.customer_name,
        companyName: customer.company_name,
        address: customer.address,
        companyAddress: customer.company_address,
        telephoneNumber: customer.telephone_number,
        fax: customer.fax,
        ntn: customer.ntn,
        createdAt: customer.created_at,
        updatedAt: customer.updated_at
      },
      message: 'Customer updated successfully'
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete customer
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    await customer.destroy();

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Search customers with pagination for autocomplete suggestions
const searchCustomersWithPagination = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const size = parseInt(req.query.size) || 10;
    const offset = page * size;
    const { search } = req.query;

    let whereClause = {};

    if (search && search.trim()) {
      whereClause[Op.or] = [
        { customer_name: { [Op.iLike]: `%${search.trim()}%` } },
        { company_name: { [Op.iLike]: `%${search.trim()}%` } }
      ];
    }

    const { count, rows } = await Customer.findAndCountAll({
      where: whereClause,
      limit: size,
      offset: offset,
      order: [['customer_name', 'ASC']],
      attributes: ['id', 'customer_name', 'company_name', 'telephone_number']
    });

    // Transform data for autocomplete
    const transformedCustomers = rows.map(customer => ({
      id: customer.id,
      customerName: customer.customer_name,
      companyName: customer.company_name,
      telephoneNumber: customer.telephone_number,
      displayName: `${customer.customer_name}${customer.company_name ? ` (${customer.company_name})` : ''}`
    }));

    res.json({
      success: true,
      customers: transformedCustomers,
      totalCount: count,
      page: page,
      size: size,
      totalPages: Math.ceil(count / size),
      hasMore: (page + 1) * size < count
    });
  } catch (error) {
    console.error('Search customers with pagination error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get materials with prices by customer ID
const getCustomerMaterialsWithPrices = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    // Validate customer ID
    if (!customerId || isNaN(customerId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid customer ID is required'
      });
    }

    // Check if customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get materials with prices for the customer
    // Using raw query to get the latest price for each material
    const materialsWithPrices = await CustomerMaterialPrice.findAll({
      where: {
        customer_id: customerId
      },
      include: [
        {
          model: Material,
          as: 'material',
          attributes: ['id', 'name', 'description', 'material_type', 'unit_price']
        }
      ],
      order: [
        ['material_id', 'ASC'],
        ['updated_at', 'DESC']
      ]
    });

    // Group by material_id and get the latest price for each material
    const materialPriceMap = new Map();
    
    materialsWithPrices.forEach(item => {
      const materialId = item.material_id;
      if (!materialPriceMap.has(materialId) || 
          new Date(item.updated_at) > new Date(materialPriceMap.get(materialId).updated_at)) {
        materialPriceMap.set(materialId, item);
      }
    });

    // Transform the data
    const result = Array.from(materialPriceMap.values()).map(item => ({
      materialId: item.material.id,
      materialName: item.material.name,
      description: item.material.description,
      materialType: item.material.material_type,
      defaultUnitPrice: parseFloat(item.material.unit_price),
      customerPrice: parseFloat(item.last_price),
      lastUpdated: item.updated_at
    }));

    res.json({
      success: true,
      data: {
        customerId: parseInt(customerId),
        customerName: customer.customer_name,
        materials: result
      },
      message: 'Customer materials with prices retrieved successfully'
    });
  } catch (error) {
    console.error('Get customer materials with prices error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomersWithPagination,
  searchCustomersWithPagination,
  getCustomerMaterialsWithPrices
};
