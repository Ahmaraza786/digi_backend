'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PurchaseOrder extends Model {
    static associate(models) {
      // Association with Customer
      PurchaseOrder.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'customerInfo'
      });
      
      // Association with Quotation (optional)
      PurchaseOrder.belongsTo(models.Quotation, {
        foreignKey: 'quotation_id',
        as: 'quotation'
      });
      
      // Association with User (created_by)
      PurchaseOrder.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
      });
      
      // Association with User (updated_by)
      PurchaseOrder.belongsTo(models.User, {
        foreignKey: 'updated_by',
        as: 'updater'
      });
      
      // Association with Invoice
      PurchaseOrder.hasMany(models.Invoice, {
        foreignKey: 'purchase_order_id',
        as: 'invoices'
      });
      
      // Association with PurchaseOrderFile
      PurchaseOrder.hasMany(models.PurchaseOrderFile, {
        foreignKey: 'purchase_order_id',
        as: 'files'
      });
    }
  }

  PurchaseOrder.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    purchase_order_no: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [1, 100]
      }
    },
    customer: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'customers',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      validate: {
        isValidCustomerId(value) {
          if (value !== null && value !== undefined && value !== '') {
            if (!Number.isInteger(Number(value)) || Number(value) < 1) {
              throw new Error('Customer ID must be a valid integer greater than 0');
            }
          }
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 1000]
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'delivered'),
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'delivered']]
      }
    },
    quotation_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: true,
        min: 1
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
    material_costs: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'JSON object storing actual costs for each material item'
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
    modelName: 'PurchaseOrder',
    tableName: 'purchase_orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['purchase_order_no']
      },
      {
        fields: ['customer']
      },
      {
        fields: ['status']
      },
      {
        fields: ['quotation_id']
      },
      {
        fields: ['created_by']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  return PurchaseOrder;
};
