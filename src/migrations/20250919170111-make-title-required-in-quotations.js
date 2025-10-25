'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // First, update any existing NULL titles to a default value
    await queryInterface.sequelize.query(`
      UPDATE quotations 
      SET title = 'Quotation #' || id 
      WHERE title IS NULL OR title = ''
    `);

    // Now make the title column NOT NULL
    await queryInterface.changeColumn('quotations', 'title', {
      type: Sequelize.STRING(255),
      allowNull: false,
      comment: 'Title/description of the quotation'
    });
  },

  async down (queryInterface, Sequelize) {
    // Revert the title column to allow NULL
    await queryInterface.changeColumn('quotations', 'title', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Title/description of the quotation'
    });
  }
};
