const { Tax } = require('../models');
const { Op } = require('sequelize');

// Get all tax records (only currently active ones)
const getAllTaxes = async (req, res) => {
  try {
    const taxes = await Tax.findAll({
      where: {
        effective_to: null // Only get currently active tax records
      },
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
  const transaction = await Tax.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { tax_percent } = req.body;
    
    // Validate tax_percent
    if (tax_percent === undefined || tax_percent === null) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Tax percentage is required'
      });
    }
    
    if (isNaN(tax_percent) || tax_percent < 1 || tax_percent > 98) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Tax percentage must be a number between 1 and 98'
      });
    }
    
    const currentTax = await Tax.findByPk(id, { transaction });
    
    if (!currentTax) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Tax record not found'
      });
    }
    
    // Check if the tax percentage is actually changing
    if (currentTax.tax_percent === parseFloat(tax_percent)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Tax percentage is already set to this value'
      });
    }
    
    const now = new Date();
    
    // If the current tax has no effective_to date (meaning it's currently active),
    // we need to set its effective_to to now and create a new record
    if (!currentTax.effective_to) {
      // Set the current tax's effective_to to now
      await currentTax.update({ 
        effective_to: now 
      }, { transaction });
      
      // Create a new tax record with the new percentage
      const newTax = await Tax.create({
        service_type: currentTax.service_type,
        tax_percent: parseFloat(tax_percent),
        effective_from: now,
        effective_to: null
      }, { transaction });
      
      await transaction.commit();
      
      res.status(200).json({
        success: true,
        message: 'Tax percentage updated successfully',
        data: newTax
      });
    } else {
      // If the tax already has an effective_to date, just update the percentage
      await currentTax.update({ 
        tax_percent: parseFloat(tax_percent),
        effective_from: now,
        effective_to: null
      }, { transaction });
      
      await transaction.commit();
      
      res.status(200).json({
        success: true,
        message: 'Tax percentage updated successfully',
        data: currentTax
      });
    }
  } catch (error) {
    await transaction.rollback();
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

// Get tax by service type for a specific date
const getTaxByServiceTypeForDate = async (req, res) => {
  try {
    const { serviceType } = req.params;
    const { date } = req.query;
    
    if (!['material', 'service'].includes(serviceType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service type. Must be either material or service'
      });
    }
    
    const targetDate = date ? new Date(date) : new Date();
    
    const tax = await Tax.findOne({
      where: {
        service_type: serviceType,
        effective_from: {
          [Op.lte]: targetDate
        },
        [Op.or]: [
          { effective_to: null },
          { effective_to: { [Op.gte]: targetDate } }
        ]
      },
      order: [['effective_from', 'DESC']]
    });
    
    if (!tax) {
      return res.status(404).json({
        success: false,
        message: 'Tax record not found for the specified service type and date'
      });
    }
    
    res.status(200).json({
      success: true,
      data: tax
    });
  } catch (error) {
    console.error('Error fetching tax by service type for date:', error);
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
  getTaxByServiceType,
  getTaxByServiceTypeForDate
};
