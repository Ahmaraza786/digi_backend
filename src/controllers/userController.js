const bcrypt = require('bcrypt');
const { User, Role } = require('../models');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{
        model: Role,
        as: 'role'
      }],
      attributes: { exclude: ['password'] } // Don't return passwords
    });

    res.json({
      success: true,
      data: users,
      message: 'Users retrieved successfully'
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, {
      include: [{
        model: Role,
        as: 'role'
      }],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'User retrieved successfully'
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create new user
const createUser = async (req, res) => {
  try {
    const { username, email, password, role_id } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }

    // Check if user already exists
    const { Op } = require('sequelize');
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password: await bcrypt.hash(password, 10),
      role_id: role_id || 4, // Default to User role
      is_active: true
    });

    // Get user with role for response
    const newUser = await User.findByPk(user.id, {
      include: [{
        model: Role,
        as: 'role'
      }],
      attributes: { exclude: ['password'] }
    });

    res.status(201).json({
      success: true,
      data: newUser,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role_id, is_active } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user
    await user.update({
      username: username || user.username,
      email: email || user.email,
      role_id: role_id !== undefined ? role_id : user.role_id,
      is_active: is_active !== undefined ? is_active : user.is_active
    });

    // Get updated user with role
    const updatedUser = await User.findByPk(id, {
      include: [{
        model: Role,
        as: 'role'
      }],
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get users with pagination (for frontend)
const getUsersWithPagination = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const size = parseInt(req.query.size) || 10;
    const offset = page * size;

    const { count, rows } = await User.findAndCountAll({
      include: [{
        model: Role,
        as: 'role'
      }],
      attributes: { exclude: ['password'] },
      limit: size,
      offset: offset,
      order: [['id', 'ASC']]
    });

    // Transform data to match frontend expectations
    const transformedUsers = rows.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      roleId: user.role_id,
      roleName: user.role ? user.role.name : 'No Role',
      isActive: user.is_active,
      createdAt: user.created_at
    }));

    res.json({
      success: true,
      users: transformedUsers,
      totalCount: count,
      page: page,
      size: size,
      totalPages: Math.ceil(count / size)
    });
  } catch (error) {
    console.error('Get users with pagination error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUsersWithPagination
};
