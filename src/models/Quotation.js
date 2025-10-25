'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Quotation extends Model {
    static associate(models) {
      // Association with Customer
      Quotation.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'customer'
      });
      
      // Association with User (created_by)
      Quotation.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
      });
      
      // Association with User (updated_by)
      Quotation.belongsTo(models.User, {
        foreignKey: 'updated_by',
        as: 'updater'
      });
      
      // Association with Invoice
      Quotation.hasMany(models.Invoice, {
        foreignKey: 'quotation_id',
        as: 'invoices'
      });
    }
  }

  Quotation.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
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
            if (!material.material_id || !material.quantity || !material.unit_price || !material.unit) {
              throw new Error(`Material at index ${index} must have material_id, quantity, unit_price, and unit`);
            }
            if (material.quantity <= 0) {
              throw new Error(`Material at index ${index} quantity must be greater than 0`);
            }
            if (material.unit_price < 0) {
              throw new Error(`Material at index ${index} unit_price must be non-negative`);
            }
            // Validate unit type
            const validUnits = ['FT', 'MTR', 'EA', 'No', 'No,s', 'JOB', 'LOT', 'Pair'];
            if (!validUnits.includes(material.unit)) {
              throw new Error(`Material at index ${index} unit must be one of: ${validUnits.join(', ')}`);
            }
          });
        }
      }
    },
    total_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        isDecimal: true
      }
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'po_received'),
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'po_received']]
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
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
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
    modelName: 'Quotation',
    tableName: 'quotations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['customer_id']
      },
      {
        fields: ['customer_name']
      },
      {
        fields: ['title']
      },
      {
        fields: ['status']
      },
      {
        fields: ['created_by']
      },
      {
        fields: ['created_at']
      }
    ],
    hooks: {
      // Total price will be provided in the payload, no automatic calculation
    }
  });

  return Quotation;
};
