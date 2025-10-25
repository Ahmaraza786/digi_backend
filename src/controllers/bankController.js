const { Bank } = require('../models');
const { Op } = require('sequelize');

// Get all banks
const getAllBanks = async (req, res) => {
  try {
    const { search, is_active } = req.query;
    
    let whereClause = {};
    
    // Filter by active status - default to true if not specified
    if (is_active !== undefined) {
      whereClause.is_active = is_active === 'true';
    } else {
      // Default to active banks only
      whereClause.is_active = true;
    }
    
    // Add search functionality
    if (search && search.trim()) {
      whereClause.bank_name = {
        [Op.iLike]: `%${search.trim()}%`
      };
    }
    
    const banks = await Bank.findAll({
      where: whereClause,
      order: [['bank_name', 'ASC']],
      attributes: ['id', 'bank_name', 'is_active', 'created_at', 'updated_at']
    });
    
    res.json({
      success: true,
      banks: banks,
      total: banks.length
    });
  } catch (error) {
    console.error('Error fetching banks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch banks',
      error: error.message
    });
  }
};

// Get bank by ID
const getBankById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const bank = await Bank.findByPk(id, {
      attributes: ['id', 'bank_name', 'is_active', 'created_at', 'updated_at']
    });
    
    if (!bank) {
      return res.status(404).json({
        success: false,
        message: 'Bank not found'
      });
    }
    
    res.json({
      success: true,
      bank: bank
    });
  } catch (error) {
    console.error('Error fetching bank:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bank',
      error: error.message
    });
  }
};

// Create new bank
const createBank = async (req, res) => {
  try {
    const { bank_name, is_active = true } = req.body;
    
    // Validate required fields
    if (!bank_name || bank_name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Bank name is required'
      });
    }
    
    // Check if bank already exists
    const existingBank = await Bank.findOne({
      where: { bank_name: bank_name.trim() }
    });
    
    if (existingBank) {
      return res.status(409).json({
        success: false,
        message: 'Bank with this name already exists'
      });
    }
    
    const bank = await Bank.create({
      bank_name: bank_name.trim(),
      is_active: is_active
    });
    
    res.status(201).json({
      success: true,
      message: 'Bank created successfully',
      bank: {
        id: bank.id,
        bank_name: bank.bank_name,
        is_active: bank.is_active,
        created_at: bank.created_at,
        updated_at: bank.updated_at
      }
    });
  } catch (error) {
    console.error('Error creating bank:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bank',
      error: error.message
    });
  }
};

// Update bank
const updateBank = async (req, res) => {
  try {
    const { id } = req.params;
    const { bank_name, is_active } = req.body;
    
    const bank = await Bank.findByPk(id);
    
    if (!bank) {
      return res.status(404).json({
        success: false,
        message: 'Bank not found'
      });
    }
    
    // Check if new bank name already exists (if name is being changed)
    if (bank_name && bank_name.trim() !== bank.bank_name) {
      const existingBank = await Bank.findOne({
        where: { 
          bank_name: bank_name.trim(),
          id: { [Op.ne]: id }
        }
      });
      
      if (existingBank) {
        return res.status(409).json({
          success: false,
          message: 'Bank with this name already exists'
        });
      }
    }
    
    // Update bank
    const updateData = {};
    if (bank_name !== undefined) updateData.bank_name = bank_name.trim();
    if (is_active !== undefined) updateData.is_active = is_active;
    
    await bank.update(updateData);
    
    res.json({
      success: true,
      message: 'Bank updated successfully',
      bank: {
        id: bank.id,
        bank_name: bank.bank_name,
        is_active: bank.is_active,
        created_at: bank.created_at,
        updated_at: bank.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating bank:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bank',
      error: error.message
    });
  }
};

// Delete bank
const deleteBank = async (req, res) => {
  try {
    const { id } = req.params;
    
    const bank = await Bank.findByPk(id);
    
    if (!bank) {
      return res.status(404).json({
        success: false,
        message: 'Bank not found'
      });
    }
    
    await bank.destroy();
    
    res.json({
      success: true,
      message: 'Bank deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bank:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete bank',
      error: error.message
    });
  }
};

// Search banks (for autocomplete)
const searchBanks = async (req, res) => {
  try {
    const { search, limit = 10 } = req.query;
    
    if (!search || search.trim().length < 2) {
      return res.json({
        success: true,
        banks: [],
        total: 0
      });
    }
    
    const banks = await Bank.findAll({
      where: {
        bank_name: {
          [Op.iLike]: `%${search.trim()}%`
        },
        is_active: true
      },
      order: [['bank_name', 'ASC']],
      limit: parseInt(limit),
      attributes: ['id', 'bank_name']
    });
    
    res.json({
      success: true,
      banks: banks,
      total: banks.length
    });
  } catch (error) {
    console.error('Error searching banks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search banks',
      error: error.message
    });
  }
};

module.exports = {
  getAllBanks,
  getBankById,
  createBank,
  updateBank,
  deleteBank,
  searchBanks
};
