const bcrypt = require('bcrypt');
const { User, Role, Permission, Tab, RolePermissionTab } = require('../models');
const { generateToken } = require('../middleware/auth');

const login = async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    // Validate input
    if (!usernameOrEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/Email and password are required'
      });
    }

    // Find user by username or email with role
    const { Op } = require('sequelize');
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username: usernameOrEmail },
          { email: usernameOrEmail }
        ]
      },
      include: [{
        model: Role,
        as: 'role'
      }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Get user permissions
    const rolePermissions = await RolePermissionTab.findAll({
      where: { role_id: user.role_id },
      include: [
        {
          model: Permission,
          as: 'permission'
        },
        {
          model: Tab,
          as: 'tab'
        }
      ]
    });

    // Format permissions by tab (match frontend expectations)
    const permissions = {};
    rolePermissions.forEach(rpt => {
      const tabName = rpt.tab.name;
      const permissionName = rpt.permission.name;
      
      if (!permissions[tabName]) {
        permissions[tabName] = [];
      }
      permissions[tabName].push(permissionName);
    });

    // Generate JWT token
    const token = generateToken(user);

    // Format response according to your specification
    const response = {
      token: token,
      type: "Bearer",
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: {
          id: user.role.id,
          name: user.role.name,
          description: user.role.description,
          createdAt: user.role.created_at,
          default: user.role.is_default
        },
        permissions: permissions
      },
      success: true,
      message: "Login successful"
    };

    res.json(response);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const validateToken = async (req, res) => {
  try {
    // Token validation is handled by authenticateToken middleware
    // If we reach here, token is valid
    res.json({
      valid: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role
      },
      message: 'Token is valid'
    });
  } catch (error) {
    res.status(401).json({
      valid: false,
      message: 'Invalid token'
    });
  }
};

module.exports = {
  login,
  validateToken
};
