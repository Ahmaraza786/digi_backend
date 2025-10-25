const { Material } = require('../models');
const { Op } = require('sequelize');

// Get materials with pagination (for frontend)
const getMaterialsWithPagination = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const size = parseInt(req.query.size) || 10;
    const offset = page * size;

    // Optional filters
    const { type, search } = req.query;
    let whereClause = {};

    if (type && ['material', 'service'].includes(type)) {
      whereClause.material_type = type;
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Material.findAndCountAll({
      where: whereClause,
      limit: size,
      offset: offset,
      order: [['id', 'ASC']]
    });

    // Transform data to match frontend expectations
    const transformedMaterials = rows.map(material => ({
      id: material.id,
      name: material.name,
      description: material.description,
      materialType: material.material_type,
      unitPrice: parseFloat(material.unit_price),
      createdAt: material.created_at,
      updatedAt: material.updated_at
    }));

    res.json({
      success: true,
      materials: transformedMaterials,
      totalCount: count,
      page: page,
      size: size,
      totalPages: Math.ceil(count / size)
    });
  } catch (error) {
    console.error('Get materials with pagination error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all materials without pagination
const getAllMaterials = async (req, res) => {
  try {
    const materials = await Material.findAll({
      order: [['id', 'ASC']]
    });

    // Transform data to match frontend expectations
    const transformedMaterials = materials.map(material => ({
      id: material.id,
      name: material.name,
      description: material.description,
      materialType: material.material_type,
      unitPrice: parseFloat(material.unit_price),
      createdAt: material.created_at,
      updatedAt: material.updated_at
    }));

    res.json(transformedMaterials);
  } catch (error) {
    console.error('Get all materials error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get material by ID
const getMaterialById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const material = await Material.findByPk(id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: material.id,
        name: material.name,
        description: material.description,
        materialType: material.material_type,
        unitPrice: parseFloat(material.unit_price),
        createdAt: material.created_at,
        updatedAt: material.updated_at
      },
      message: 'Material retrieved successfully'
    });
  } catch (error) {
    console.error('Get material error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create new material
const createMaterial = async (req, res) => {
  try {
    const { name, description, materialType, unitPrice } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Material name is required'
      });
    }

    if (!materialType || !['material', 'service'].includes(materialType)) {
      return res.status(400).json({
        success: false,
        message: 'Valid material type (material or service) is required'
      });
    }

    if (unitPrice === undefined || unitPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid unit price is required'
      });
    }

    // Check if material with same name already exists
    const existingMaterial = await Material.findOne({
      where: { name: { [Op.iLike]: name } }
    });

    if (existingMaterial) {
      return res.status(400).json({
        success: false,
        message: 'Material with this name already exists'
      });
    }

    // Create material
    const material = await Material.create({
      name,
      description: description || null,
      material_type: materialType,
      unit_price: unitPrice
    });

    res.status(201).json({
      success: true,
      data: {
        id: material.id,
        name: material.name,
        description: material.description,
        materialType: material.material_type,
        unitPrice: parseFloat(material.unit_price),
        createdAt: material.created_at,
        updatedAt: material.updated_at
      },
      message: 'Material created successfully'
    });
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update material
const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, materialType, unitPrice } = req.body;

    const material = await Material.findByPk(id);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    // Validate material type if provided
    if (materialType && !['material', 'service'].includes(materialType)) {
      return res.status(400).json({
        success: false,
        message: 'Valid material type (material or service) is required'
      });
    }

    // Validate unit price if provided
    if (unitPrice !== undefined && unitPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Unit price cannot be negative'
      });
    }

    // Check if name is being changed and if it conflicts with existing material
    if (name && name !== material.name) {
      const existingMaterial = await Material.findOne({
        where: { 
          name: { [Op.iLike]: name },
          id: { [Op.ne]: id }
        }
      });

      if (existingMaterial) {
        return res.status(400).json({
          success: false,
          message: 'Material with this name already exists'
        });
      }
    }

    // Update material
    await material.update({
      name: name || material.name,
      description: description !== undefined ? description : material.description,
      material_type: materialType || material.material_type,
      unit_price: unitPrice !== undefined ? unitPrice : material.unit_price
    });

    res.json({
      success: true,
      data: {
        id: material.id,
        name: material.name,
        description: material.description,
        materialType: material.material_type,
        unitPrice: parseFloat(material.unit_price),
        createdAt: material.created_at,
        updatedAt: material.updated_at
      },
      message: 'Material updated successfully'
    });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete material
const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    const material = await Material.findByPk(id);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    await material.destroy();

    res.json({
      success: true,
      message: 'Material deleted successfully'
    });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getMaterialsWithPagination
};
