'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('purchase_orders', 'purchase_order_file', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'S3 URL of the uploaded purchase order file (PDF or image)'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('purchase_orders', 'purchase_order_file');
  }
};
