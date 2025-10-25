'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('quotations', 'title', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Title/description of the quotation'
    });

    // Add index for title field for better search performance
    await queryInterface.addIndex('quotations', ['title'], {
      name: 'idx_quotations_title'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove the index first
    await queryInterface.removeIndex('quotations', 'idx_quotations_title');
    
    // Remove the column
    await queryInterface.removeColumn('quotations', 'title');
  }
};
