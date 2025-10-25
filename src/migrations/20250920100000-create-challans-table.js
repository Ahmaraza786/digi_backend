'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('challans', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      challan_no: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      purchase_order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'purchase_orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      customer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      customer_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      materials: {
        type: Sequelize.JSON,
        allowNull: false
      },
      total_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      challan_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      notes: {
        type: Sequelize.TEXT,
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
    await queryInterface.addIndex('challans', ['challan_no']);
    await queryInterface.addIndex('challans', ['purchase_order_id']);
    await queryInterface.addIndex('challans', ['quotation_id']);
    await queryInterface.addIndex('challans', ['customer_id']);
    await queryInterface.addIndex('challans', ['challan_date']);
    await queryInterface.addIndex('challans', ['created_by']);
    await queryInterface.addIndex('challans', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('challans');
  }
};
