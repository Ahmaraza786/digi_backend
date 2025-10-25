const { Tax } = require('../models');
const { Op } = require('sequelize');

// Get all tax records
const getAllTaxes = async (req, res) => {
  try {
    const taxes = await Tax.findAll({
      order: [['service_type', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      data: taxes
    });
  } catch (error) {
    console.error('Error fetching taxes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tax records',
      error: error.message
    });
  }
};

// Get tax by ID
const getTaxById = async (req, res) => {
  try {
    const { id } = req.params;
    const tax = await Tax.findByPk(id);
    
    if (!tax) {
      return res.status(404).json({
        success: false,
        message: 'Tax record not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: tax
    });
  } catch (error) {
    console.error('Error fetching tax:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tax record',
      error: error.message
    });
  }
};

// Update tax percentage
const updateTax = async (req, res) => {
  try {
    const { id } = req.params;
    const { tax_percent } = req.body;
    
    // Validate tax_percent
    if (tax_percent === undefined || tax_percent === null) {
      return res.status(400).json({
        success: false,
        message: 'Tax percentage is required'
      });
    }
    
    if (isNaN(tax_percent) || tax_percent < 1 || tax_percent > 98) {
      return res.status(400).json({
        success: false,
        message: 'Tax percentage must be a number between 1 and 98'
      });
    }
    
    const tax = await Tax.findByPk(id);
    
    if (!tax) {
      return res.status(404).json({
        success: false,
        message: 'Tax record not found'
      });
    }
    
    // Update only the tax_percent field
    await tax.update({ tax_percent });
    
    res.status(200).json({
      success: true,
      message: 'Tax percentage updated successfully',
      data: tax
    });
  } catch (error) {
    console.error('Error updating tax:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating tax record',
      error: error.message
    });
  }
};

// Get tax by service type
const getTaxByServiceType = async (req, res) => {
  try {
    const { serviceType } = req.params;
    
    if (!['material', 'service'].includes(serviceType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service type. Must be either material or service'
      });
    }
    
    const tax = await Tax.findOne({
      where: { service_type: serviceType }
    });
    
    if (!tax) {
      return res.status(404).json({
        success: false,
        message: 'Tax record not found for the specified service type'
      });
    }
    
    res.status(200).json({
      success: true,
      data: tax
    });
  } catch (error) {
    console.error('Error fetching tax by service type:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tax record',
      error: error.message
    });
  }
};

module.exports = {
  getAllTaxes,
  getTaxById,
  updateTax,
  getTaxByServiceType
};
