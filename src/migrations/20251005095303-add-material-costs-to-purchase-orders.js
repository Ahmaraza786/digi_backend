'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('purchase_orders', 'material_costs', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'JSON object storing actual costs for each material item'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('purchase_orders', 'material_costs');
  }
};
