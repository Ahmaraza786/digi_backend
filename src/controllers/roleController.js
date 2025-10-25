const { Role, Permission, Tab, RolePermissionTab, User } = require('../models');

// Get all roles
const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({
      order: [['id', 'ASC']]
    });

    res.json({
      success: true,
      data: roles,
      message: 'Roles retrieved successfully'
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get role by ID with permissions
const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Get role permissions
    const rolePermissions = await RolePermissionTab.findAll({
      where: { role_id: id },
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

    // Format permissions by tab
    const permissions = {};
    rolePermissions.forEach(rpt => {
      const tabName = rpt.tab.name;
      const permissionName = rpt.permission.name;
      
      if (!permissions[tabName]) {
        permissions[tabName] = [];
      }
      permissions[tabName].push(permissionName);
    });

    res.json({
      success: true,
      data: {
        ...role.toJSON(),
        permissions
      },
      message: 'Role retrieved successfully'
    });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create new role
const createRole = async (req, res) => {
  try {
    const { name, description, is_default } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Role name is required'
      });
    }

    // Check if role already exists
    const existingRole = await Role.findOne({ where: { name } });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'Role already exists'
      });
    }

    const role = await Role.create({
      name,
      description,
      is_default: is_default || false
    });

    res.status(201).json({
      success: true,
      data: role,
      message: 'Role created successfully'
    });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update role
const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_default } = req.body;

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    await role.update({
      name: name || role.name,
      description: description || role.description,
      is_default: is_default !== undefined ? is_default : role.is_default
    });

    res.json({
      success: true,
      data: role,
      message: 'Role updated successfully'
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete role
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Check if role is in use
    const usersWithRole = await User.count({ where: { role_id: id } });
    if (usersWithRole > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete role that is assigned to users'
      });
    }

    await role.destroy();

    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Assign permissions to role
const assignPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body; // Array of { permission_id, tab_id }

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Remove existing permissions for this role
    await RolePermissionTab.destroy({ where: { role_id: id } });

    // Add new permissions
    if (permissions && permissions.length > 0) {
      const rolePermissions = permissions.map(perm => ({
        role_id: id,
        permission_id: perm.permission_id,
        tab_id: perm.tab_id
      }));

      await RolePermissionTab.bulkCreate(rolePermissions);
    }

    res.json({
      success: true,
      message: 'Permissions assigned successfully'
    });
  } catch (error) {
    console.error('Assign permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get roles with IDs and names only (for frontend dropdowns)
const getRoleIdsAndNames = async (req, res) => {
  try {
    const roles = await Role.findAll({
      attributes: ['id', 'name'],
      order: [['id', 'ASC']]
    });

    res.json(roles);
  } catch (error) {
    console.error('Get role IDs and names error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get roles with permissions (for frontend)
const getRolesWithPermissions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const size = parseInt(req.query.size) || 10;
    
    const roles = await Role.findAll({
      order: [['id', 'ASC']]
    });

    // Get permissions for each role
    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => {
        const rolePermissions = await RolePermissionTab.findAll({
          where: { role_id: role.id },
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

        // Format permissions by feature
        const permissions = rolePermissions.map(rp => ({
          featureId: rp.tab_id,
          featureName: rp.tab.display_name || rp.tab.name,
          operations: [rp.permission.name]
        }));

        return {
          id: role.id,
          name: role.name,
          description: role.description,
          isDefault: role.is_default,
          createdAt: role.created_at,
          permissions: permissions
        };
      })
    );

    res.json(rolesWithPermissions);
  } catch (error) {
    console.error('Get roles with permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create role with permissions (for frontend role management)
const addRoleWithPermissions = async (req, res) => {
  try {
    const { name, description, isDefault, permissions } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Role name is required'
      });
    }

    // Check if role already exists
    const existingRole = await Role.findOne({ where: { name } });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'Role already exists'
      });
    }

    // Create the role
    const role = await Role.create({
      name,
      description,
      is_default: isDefault || false
    });

    // Add permissions if provided
    if (permissions && permissions.length > 0) {
      const rolePermissions = [];
      
      permissions.forEach(perm => {
        perm.operations.forEach(operation => {
          // Find permission ID by name
          rolePermissions.push({
            role_id: role.id,
            permission_id: getPermissionIdByName(operation),
            tab_id: perm.featureId,
            created_at: new Date()
          });
        });
      });

      if (rolePermissions.length > 0) {
        await RolePermissionTab.bulkCreate(rolePermissions);
      }
    }

    res.status(201).json({
      success: true,
      data: role,
      message: 'Role created successfully'
    });
  } catch (error) {
    console.error('Create role with permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update role permissions (for frontend role management)
const updateRolePermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isDefault, permissions } = req.body;

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Update role basic info
    await role.update({
      name: name || role.name,
      description: description || role.description,
      is_default: isDefault !== undefined ? isDefault : role.is_default
    });

    // Remove existing permissions
    await RolePermissionTab.destroy({ where: { role_id: id } });

    // Add new permissions if provided
    if (permissions && permissions.length > 0) {
      const rolePermissions = [];
      
      permissions.forEach(perm => {
        perm.operations.forEach(operation => {
          rolePermissions.push({
            role_id: parseInt(id),
            permission_id: getPermissionIdByName(operation),
            tab_id: perm.featureId,
            created_at: new Date()
          });
        });
      });

      if (rolePermissions.length > 0) {
        await RolePermissionTab.bulkCreate(rolePermissions);
      }
    }

    res.json({
      success: true,
      data: role,
      message: 'Role updated successfully'
    });
  } catch (error) {
    console.error('Update role permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Helper function to get permission ID by name
const getPermissionIdByName = (permissionName) => {
  const permissionMap = {
    'create': 1,
    'read': 2,
    'update': 3,
    'delete': 4,
    'export': 5,
    'import': 6,
    'manage': 7
  };
  return permissionMap[permissionName] || 2; // Default to read
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  assignPermissions,
  getRoleIdsAndNames,
  getRolesWithPermissions,
  addRoleWithPermissions,
  updateRolePermissions
};
