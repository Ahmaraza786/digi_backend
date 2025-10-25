'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Challan extends Model {
    static associate(models) {
      // Association with PurchaseOrder
      Challan.belongsTo(models.PurchaseOrder, {
        foreignKey: 'purchase_order_id',
        as: 'purchaseOrder'
      });
      
      // Association with Quotation
      Challan.belongsTo(models.Quotation, {
        foreignKey: 'quotation_id',
        as: 'quotation'
      });
      
      // Association with Customer
      Challan.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'customer'
      });
      
      // Association with User (created_by)
      Challan.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
      });
    }
  }

  Challan.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    challan_no: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [1, 50]
      }
    },
    purchase_order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'purchase_orders',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      validate: {
        notNull: true,
        isInt: true,
        min: 1
      }
    },
    quotation_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'quotations',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      validate: {
        isInt: true,
        min: 1
      }
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      validate: {
        notNull: true,
        isInt: true,
        min: 1
      }
    },
    customer_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    materials: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        notEmpty: true,
        isValidMaterials(value) {
          if (!Array.isArray(value)) {
            throw new Error('Materials must be an array');
          }
          if (value.length === 0) {
            throw new Error('At least one material is required');
          }
          // Validate each material object
          value.forEach((material, index) => {
            if (!material.material_id || !material.material_name || !material.quantity || !material.unit) {
              throw new Error(`Material at index ${index} must have material_id, material_name, quantity, and unit`);
            }
            if (material.quantity <= 0) {
              throw new Error(`Material at index ${index} quantity must be greater than 0`);
            }
          });
        }
      }
    },
    total_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        isInt: true
      }
    },
    challan_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 1000]
      }
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: true,
        isInt: true,
        min: 1
      }
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Challan',
    tableName: 'challans',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['challan_no']
      },
      {
        fields: ['purchase_order_id']
      },
      {
        fields: ['quotation_id']
      },
      {
        fields: ['customer_id']
      },
      {
        fields: ['challan_date']
      },
      {
        fields: ['created_by']
      },
      {
        fields: ['created_at']
      }
    ],
    hooks: {
      beforeCreate: async (challan) => {
        // Calculate total quantity from materials
        if (challan.materials && Array.isArray(challan.materials)) {
          challan.total_quantity = challan.materials.reduce((total, material) => {
            return total + (parseInt(material.quantity) || 0);
          }, 0);
        }
      },
      beforeUpdate: async (challan) => {
        // Recalculate total quantity if materials changed
        if (challan.changed('materials') && challan.materials && Array.isArray(challan.materials)) {
          challan.total_quantity = challan.materials.reduce((total, material) => {
            return total + (parseInt(material.quantity) || 0);
          }, 0);
        }
      }
    }
  });

  return Challan;
};
