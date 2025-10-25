'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('invoices', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      customer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      quotation_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'quotations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      purchase_order_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'purchase_orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      status: {
        type: Sequelize.ENUM('unpaid', 'paid'),
        allowNull: false,
        defaultValue: 'unpaid'
      },
      total_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      tax_deducted: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
        defaultValue: 0
      },
      invoice_type: {
        type: Sequelize.ENUM('material', 'service'),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      with_hold_tax: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      cheque_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      voucher_no: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      bank: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      deposit_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      dw_bank: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('invoices', ['customer_id']);
    await queryInterface.addIndex('invoices', ['quotation_id']);
    await queryInterface.addIndex('invoices', ['purchase_order_id']);
    await queryInterface.addIndex('invoices', ['status']);
    await queryInterface.addIndex('invoices', ['invoice_type']);
    await queryInterface.addIndex('invoices', ['created_by']);
    await queryInterface.addIndex('invoices', ['created_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('invoices');
  }
};
