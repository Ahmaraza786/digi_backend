'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('taxes', 'effective_from', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });

    await queryInterface.addColumn('taxes', 'effective_to', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Update existing records to have effective_from as their created_at date
    await queryInterface.sequelize.query(`
      UPDATE taxes 
      SET effective_from = created_at 
      WHERE effective_from IS NULL
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('taxes', 'effective_from');
    await queryInterface.removeColumn('taxes', 'effective_to');
  }
};
