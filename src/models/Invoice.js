'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Invoice extends Model {
    static associate(models) {
      // Association with Customer
      Invoice.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'customer'
      });
      
      // Association with Quotation
      Invoice.belongsTo(models.Quotation, {
        foreignKey: 'quotation_id',
        as: 'quotation'
      });
      
      // Association with PurchaseOrder
      Invoice.belongsTo(models.PurchaseOrder, {
        foreignKey: 'purchase_order_id',
        as: 'purchaseOrder'
      });
      
      // Association with User (created_by)
      Invoice.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
      });
      
      // Association with User (updated_by)
      Invoice.belongsTo(models.User, {
        foreignKey: 'updated_by',
        as: 'updater'
      });
    }
  }

  Invoice.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
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
    quotation_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    purchase_order_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: true,
        min: 1
      }
    },
    status: {
      type: DataTypes.ENUM('unpaid', 'paid'),
      allowNull: false,
      defaultValue: 'unpaid',
      validate: {
        isIn: [['unpaid', 'paid']]
      }
    },
    total_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        notNull: true,
        isDecimal: true,
        min: 0
      }
    },
    tax_deducted: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0,
      validate: {
        isDecimal: true,
        min: 0
      }
    },
    invoice_type: {
      type: DataTypes.ENUM('material', 'service'),
      allowNull: false,
      validate: {
        isIn: [['material', 'service']]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 1000]
      }
    },
    with_hold_tax: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    cheque_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      validate: {
        isDecimal: true,
        min: 0
      }
    },
    voucher_no: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: [0, 100]
      }
    },
    bank: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: [0, 100]
      }
    },
    deposit_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    dw_bank: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: [0, 100]
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
    modelName: 'Invoice',
    tableName: 'invoices',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['customer_id']
      },
      {
        fields: ['quotation_id']
      },
      {
        fields: ['purchase_order_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['invoice_type']
      },
      {
        fields: ['created_by']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  return Invoice;
};
