'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('purchase_orders', 'customer_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'customers',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add index for better performance
    await queryInterface.addIndex('purchase_orders', ['customer_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('purchase_orders', ['customer_id']);
    await queryInterface.removeColumn('purchase_orders', 'customer_id');
  }
};
