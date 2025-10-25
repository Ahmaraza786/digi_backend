const { Quotation, Customer, User, Material, CustomerMaterialPrice } = require('../models');
const { Op } = require('sequelize');

// Get quotations with pagination and search functionality
const getQuotationsWithPagination = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const size = parseInt(req.query.size) || 10;
    const offset = page * size;

    // Search parameters
    const { search, quotation_id, customer_id, customer_name, status } = req.query;
    let whereClause = {};

    // Build search conditions
    if (quotation_id) {
      whereClause.id = quotation_id;
    }

    if (customer_id) {
      whereClause.customer_id = customer_id;
    }

    if (customer_name) {
      whereClause.customer_name = { [Op.iLike]: `%${customer_name}%` };
    }

    if (status) {
      whereClause.status = status;
    }

    // General search across multiple fields
    if (search) {
      whereClause[Op.or] = [
        { id: { [Op.eq]: isNaN(search) ? -1 : parseInt(search) } }, // Search by ID if numeric
        { customer_name: { [Op.iLike]: `%${search}%` } },
        { title: { [Op.iLike]: `%${search}%` } }, // Search by title
        { customer_id: { [Op.eq]: isNaN(search) ? -1 : parseInt(search) } } // Search by customer ID if numeric
      ];
    }

    const { count, rows } = await Quotation.findAndCountAll({
      where: whereClause,
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
          attributes: ['id', 'username', 'email'],
          required: false
        }
      ],
      limit: size,
      offset: offset,
      order: [['created_at', 'DESC']]
    });

    // Transform data to match frontend expectations
    const transformedQuotations = rows.map(quotation => ({
      id: quotation.id,
      title: quotation.title,
      materials: quotation.materials,
      totalPrice: parseFloat(quotation.total_price),
      customerId: quotation.customer_id,
      customerName: quotation.customer_name,
      status: quotation.status,
      createdBy: quotation.created_by,
      updatedBy: quotation.updated_by,
      createdAt: quotation.created_at,
      updatedAt: quotation.updated_at,
      customer: quotation.customer ? {
        id: quotation.customer.id,
        customerName: quotation.customer.customer_name,
        companyName: quotation.customer.company_name,
        address: quotation.customer.address,
        companyAddress: quotation.customer.company_address,
        telephoneNumber: quotation.customer.telephone_number,
        fax: quotation.customer.fax,
        createdAt: quotation.customer.created_at,
        updatedAt: quotation.customer.updated_at
      } : null,
      creator: quotation.creator,
      updater: quotation.updater
    }));

    res.json({
      success: true,
      quotations: transformedQuotations,
      totalCount: count,
      page: page,
      size: size,
      totalPages: Math.ceil(count / size)
    });
  } catch (error) {
    console.error('Get quotations with pagination error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all quotations without pagination
const getAllQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.findAll({
      include: [
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
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: quotations,
      message: 'Quotations retrieved successfully'
    });
  } catch (error) {
    console.error('Get all quotations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get quotation by ID
const getQuotationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const quotation = await Quotation.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customer_name', 'company_name', 'address', 'telephone_number']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'username', 'email'],
          required: false
        }
      ]
    });

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: quotation.id,
        title: quotation.title,
        materials: quotation.materials,
        totalPrice: parseFloat(quotation.total_price),
        customerId: quotation.customer_id,
        customerName: quotation.customer_name,
        status: quotation.status,
        createdBy: quotation.created_by,
        updatedBy: quotation.updated_by,
        createdAt: quotation.created_at,
        updatedAt: quotation.updated_at,
        customer: quotation.customer ? {
          id: quotation.customer.id,
          customerName: quotation.customer.customer_name,
          companyName: quotation.customer.company_name,
          address: quotation.customer.address,
          companyAddress: quotation.customer.company_address,
          telephoneNumber: quotation.customer.telephone_number,
          fax: quotation.customer.fax,
          createdAt: quotation.customer.created_at,
          updatedAt: quotation.customer.updated_at
        } : null,
        creator: quotation.creator,
        updater: quotation.updater
      },
      message: 'Quotation retrieved successfully'
    });
  } catch (error) {
    console.error('Get quotation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create new quotation
const createQuotation = async (req, res) => {
  try {
    const { materials, total_price, customer_id, customer_name, title, status, created_by } = req.body;

    // Validate required fields
    if (!materials || !Array.isArray(materials) || materials.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Materials array is required and must not be empty'
      });
    }

    if (!customer_id) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required'
      });
    }

    if (!customer_name) {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required'
      });
    }

    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    if (!created_by) {
      return res.status(400).json({
        success: false,
        message: 'Created by user ID is required'
      });
    }

    if (!total_price || total_price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Total price is required and must be non-negative'
      });
    }

    // Validate that customer exists
    const customer = await Customer.findByPk(customer_id);
    if (!customer) {
      return res.status(400).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Validate that user exists
    const user = await User.findByPk(created_by);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate materials and get material details
    const materialIds = materials.map(m => m.material_id);
    const existingMaterials = await Material.findAll({
      where: { id: { [Op.in]: materialIds } }
    });

    if (existingMaterials.length !== materialIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more materials not found'
      });
    }

    // Material prices in quotations are independent of base material prices
    // No automatic updates to material base prices will be performed

    // Create quotation
    const quotation = await Quotation.create({
      materials: materials,
      total_price: total_price,
      customer_id: customer_id,
      customer_name: customer_name,
      title: title.trim(),
      status: status || 'pending',
      created_by: created_by,
      updated_by: created_by
    });

    // Save customer material prices for future reference
    try {
      const customerPricePromises = materials.map(async (material) => {
        const [customerPrice, created] = await CustomerMaterialPrice.findOrCreate({
          where: {
            customer_id: customer_id,
            material_id: material.material_id
          },
          defaults: {
            customer_id: customer_id,
            material_id: material.material_id,
            last_price: material.unit_price,
            updated_at: new Date()
          }
        });
        
        if (!created) {
          // Update existing record
          await customerPrice.update({
            last_price: material.unit_price,
            updated_at: new Date()
          });
        }
        
        return customerPrice;
      });
      
      await Promise.all(customerPricePromises);
      console.log('Customer material prices saved successfully');
    } catch (priceError) {
      console.error('Error saving customer material prices:', priceError);
      // Don't fail the quotation creation if price saving fails
    }

    // Fetch the created quotation with associations
    const createdQuotation = await Quotation.findByPk(quotation.id, {
      include: [
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
      ]
    });

    // Prepare response message
    const responseMessage = 'Quotation created successfully';

    res.status(201).json({
      success: true,
      data: {
        id: createdQuotation.id,
        title: createdQuotation.title,
        materials: createdQuotation.materials,
        totalPrice: parseFloat(createdQuotation.total_price),
        customerId: createdQuotation.customer_id,
        customerName: createdQuotation.customer_name,
        status: createdQuotation.status,
        createdBy: createdQuotation.created_by,
        updatedBy: createdQuotation.updated_by,
        createdAt: createdQuotation.created_at,
        updatedAt: createdQuotation.updated_at,
        customer: createdQuotation.customer ? {
          id: createdQuotation.customer.id,
          customerName: createdQuotation.customer.customer_name,
          companyName: createdQuotation.customer.company_name,
          address: createdQuotation.customer.address,
          companyAddress: createdQuotation.customer.company_address,
          telephoneNumber: createdQuotation.customer.telephone_number,
          fax: createdQuotation.customer.fax,
          createdAt: createdQuotation.customer.created_at,
          updatedAt: createdQuotation.customer.updated_at
        } : null,
        creator: createdQuotation.creator
      },
      message: responseMessage
    });
  } catch (error) {
    console.error('Create quotation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update quotation
const updateQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const { materials, total_price, customer_id, customer_name, title, status, updated_by } = req.body;

    const quotation = await Quotation.findByPk(id);
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    // Validate materials if provided
    if (materials && Array.isArray(materials) && materials.length > 0) {
      const materialIds = materials.map(m => m.material_id);
      const existingMaterials = await Material.findAll({
        where: { id: { [Op.in]: materialIds } }
      });

      if (existingMaterials.length !== materialIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more materials not found'
        });
      }

      // Material prices in quotations are independent of base material prices
      // No automatic updates to material base prices will be performed
    }

    // Validate customer if provided
    if (customer_id) {
      const customer = await Customer.findByPk(customer_id);
      if (!customer) {
        return res.status(400).json({
          success: false,
          message: 'Customer not found'
        });
      }
    }

    // Validate user if provided
    if (updated_by) {
      const user = await User.findByPk(updated_by);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'User not found'
        });
      }
    }

    // Update quotation
    await quotation.update({
      materials: materials || quotation.materials,
      total_price: total_price !== undefined ? total_price : quotation.total_price,
      customer_id: customer_id || quotation.customer_id,
      customer_name: customer_name || quotation.customer_name,
      title: title !== undefined ? title.trim() : quotation.title,
      status: status || quotation.status,
      updated_by: updated_by || quotation.updated_by
    });

    // Save customer material prices for future reference if materials are updated
    if (materials && Array.isArray(materials) && materials.length > 0) {
      try {
        const finalCustomerId = customer_id || quotation.customer_id;
        const customerPricePromises = materials.map(async (material) => {
          const [customerPrice, created] = await CustomerMaterialPrice.findOrCreate({
            where: {
              customer_id: finalCustomerId,
              material_id: material.material_id
            },
            defaults: {
              customer_id: finalCustomerId,
              material_id: material.material_id,
              last_price: material.unit_price,
              updated_at: new Date()
            }
          });
          
          if (!created) {
            // Update existing record
            await customerPrice.update({
              last_price: material.unit_price,
              updated_at: new Date()
            });
          }
          
          return customerPrice;
        });
        
        await Promise.all(customerPricePromises);
        console.log('Customer material prices updated successfully');
      } catch (priceError) {
        console.error('Error updating customer material prices:', priceError);
        // Don't fail the quotation update if price saving fails
      }
    }

    // Fetch updated quotation with associations
    const updatedQuotation = await Quotation.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customer_name', 'company_name']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'username', 'email'],
          required: false
        }
      ]
    });

    // Prepare response message
    const responseMessage = 'Quotation updated successfully';

    res.json({
      success: true,
      data: {
        id: updatedQuotation.id,
        title: updatedQuotation.title,
        materials: updatedQuotation.materials,
        totalPrice: parseFloat(updatedQuotation.total_price),
        customerId: updatedQuotation.customer_id,
        customerName: updatedQuotation.customer_name,
        status: updatedQuotation.status,
        createdBy: updatedQuotation.created_by,
        updatedBy: updatedQuotation.updated_by,
        createdAt: updatedQuotation.created_at,
        updatedAt: updatedQuotation.updated_at,
        customer: updatedQuotation.customer ? {
          id: updatedQuotation.customer.id,
          customerName: updatedQuotation.customer.customer_name,
          companyName: updatedQuotation.customer.company_name,
          address: updatedQuotation.customer.address,
          companyAddress: updatedQuotation.customer.company_address,
          telephoneNumber: updatedQuotation.customer.telephone_number,
          fax: updatedQuotation.customer.fax,
          createdAt: updatedQuotation.customer.created_at,
          updatedAt: updatedQuotation.customer.updated_at
        } : null,
        creator: updatedQuotation.creator,
        updater: updatedQuotation.updater
      },
      message: responseMessage
    });
  } catch (error) {
    console.error('Update quotation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete quotation
const deleteQuotation = async (req, res) => {
  try {
    const { id } = req.params;

    const quotation = await Quotation.findByPk(id);
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    await quotation.destroy();

    res.json({
      success: true,
      message: 'Quotation deleted successfully'
    });
  } catch (error) {
    console.error('Delete quotation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Search quotations by various criteria
const searchQuotations = async (req, res) => {
  try {
    const { quotation_id, customer_id, customer_name, status, search } = req.query;
    let whereClause = {};

    // Build search conditions
    if (quotation_id) {
      whereClause.id = quotation_id;
    }

    if (customer_id) {
      whereClause.customer_id = customer_id;
    }

    if (customer_name) {
      whereClause.customer_name = { [Op.iLike]: `%${customer_name}%` };
    }

    if (status) {
      whereClause.status = status;
    }

    // General search
    if (search) {
      whereClause[Op.or] = [
        { id: { [Op.eq]: isNaN(search) ? -1 : parseInt(search) } },
        { customer_name: { [Op.iLike]: `%${search}%` } },
        { title: { [Op.iLike]: `%${search}%` } }, // Search by title
        { customer_id: { [Op.eq]: isNaN(search) ? -1 : parseInt(search) } }
      ];
    }

    const quotations = await Quotation.findAll({
      where: whereClause,
      include: [
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
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: quotations,
      message: 'Search completed successfully'
    });
  } catch (error) {
    console.error('Search quotations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get quotations by customer ID
const getQuotationsByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    if (!customerId || isNaN(customerId)) {
      return res.status(400).json({ error: 'Valid customer ID is required' });
    }

    const quotations = await Quotation.findAll({
      where: { customer_id: customerId },
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
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Transform data to match frontend expectations
    const transformedQuotations = quotations.map(quotation => ({
      id: quotation.id,
      title: quotation.title,
      materials: quotation.materials,
      totalPrice: parseFloat(quotation.total_price),
      customerId: quotation.customer_id,
      customerName: quotation.customer_name,
      status: quotation.status,
      createdBy: quotation.created_by,
      createdAt: quotation.created_at,
      updatedAt: quotation.updated_at,
      customer: quotation.customer ? {
        id: quotation.customer.id,
        customerName: quotation.customer.customer_name,
        companyName: quotation.customer.company_name,
        telephoneNumber: quotation.customer.telephone_number
      } : null,
      creator: quotation.creator
    }));

    res.json({
      success: true,
      quotations: transformedQuotations,
      count: transformedQuotations.length
    });
  } catch (error) {
    console.error('Error fetching quotations by customer ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  getQuotationsWithPagination,
  searchQuotations,
  getQuotationsByCustomerId
};
