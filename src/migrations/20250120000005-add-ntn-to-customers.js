'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('customers', 'ntn', {
      type: Sequelize.STRING(50),
      allowNull: true,
      validate: {
        len: [0, 50]
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('customers', 'ntn');
  }
};
