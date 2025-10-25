const express = require('express');
const { 
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
} = require('../controllers/roleController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/roles/ids-and-names (for frontend dropdowns)
router.get('/ids-and-names', getRoleIdsAndNames);

// GET /api/roles/with-permissions (for frontend role management)
router.get('/with-permissions', getRolesWithPermissions);

// GET /api/roles (get all roles)
router.get('/', getAllRoles);

// GET /api/roles/:id
router.get('/:id', getRoleById);

// POST /api/roles
router.post('/', createRole);

// PUT /api/roles/:id
router.put('/:id', updateRole);

// DELETE /api/roles/:id
router.delete('/:id', deleteRole);

// POST /api/roles/:id/permissions
router.post('/:id/permissions', assignPermissions);

// POST /api/roles/add-role-permission (for frontend role management)
router.post('/add-role-permission', addRoleWithPermissions);

// PUT /api/roles/:id/permissions (for frontend role management)
router.put('/:id/permissions', updateRolePermissions);

module.exports = router;
