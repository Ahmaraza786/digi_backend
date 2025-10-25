'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('quotations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      materials: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'JSON array of materials with quantities and prices'
      },
      total_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
          min: 0
        }
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
      customer_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Denormalized customer name for quick access'
      },
      status: {
        type: Sequelize.ENUM('pending', 'delivered', 'successful'),
        allowNull: false,
        defaultValue: 'pending'
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
    await queryInterface.addIndex('quotations', ['customer_id'], {
      name: 'idx_quotations_customer_id'
    });
    
    await queryInterface.addIndex('quotations', ['customer_name'], {
      name: 'idx_quotations_customer_name'
    });
    
    await queryInterface.addIndex('quotations', ['status'], {
      name: 'idx_quotations_status'
    });
    
    await queryInterface.addIndex('quotations', ['created_by'], {
      name: 'idx_quotations_created_by'
    });
    
    await queryInterface.addIndex('quotations', ['created_at'], {
      name: 'idx_quotations_created_at'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('quotations');
  }
};