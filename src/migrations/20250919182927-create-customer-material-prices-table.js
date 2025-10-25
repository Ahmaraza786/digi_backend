'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('customer_material_prices', {
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
        onDelete: 'CASCADE'
      },
      material_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'materials',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      last_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add unique constraint for customer_id and material_id combination
    await queryInterface.addIndex('customer_material_prices', {
      fields: ['customer_id', 'material_id'],
      unique: true,
      name: 'customer_material_prices_customer_material_unique'
    });

    // Add index for faster queries on customer_id
    await queryInterface.addIndex('customer_material_prices', {
      fields: ['customer_id'],
      name: 'customer_material_prices_customer_id_index'
    });

    // Add index for faster queries on material_id
    await queryInterface.addIndex('customer_material_prices', {
      fields: ['material_id'],
      name: 'customer_material_prices_material_id_index'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('customer_material_prices');
  }
};
