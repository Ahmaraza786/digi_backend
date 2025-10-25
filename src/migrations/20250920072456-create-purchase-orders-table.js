'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_orders', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      purchase_order_no: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Unique purchase order number'
      },
      customer: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Customer name'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Purchase order description'
      },
      status: {
        type: Sequelize.ENUM('pending', 'delivered'),
        allowNull: false,
        defaultValue: 'pending'
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
        allowNull: true,
        references: {
          model: 'customers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      material_costs: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'JSON object storing actual costs for each material item'
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

    // Add indexes for better query performance
    await queryInterface.addIndex('purchase_orders', ['purchase_order_no'], {
      name: 'idx_purchase_orders_purchase_order_no'
    });
    
    await queryInterface.addIndex('purchase_orders', ['customer'], {
      name: 'idx_purchase_orders_customer'
    });
    
    await queryInterface.addIndex('purchase_orders', ['status'], {
      name: 'idx_purchase_orders_status'
    });
    
    await queryInterface.addIndex('purchase_orders', ['quotation_id'], {
      name: 'idx_purchase_orders_quotation_id'
    });
    
    await queryInterface.addIndex('purchase_orders', ['created_by'], {
      name: 'idx_purchase_orders_created_by'
    });
    
    await queryInterface.addIndex('purchase_orders', ['created_at'], {
      name: 'idx_purchase_orders_created_at'
    });
    
    await queryInterface.addIndex('purchase_orders', ['customer_id'], {
      name: 'idx_purchase_orders_customer_id'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('purchase_orders');
  }
};
