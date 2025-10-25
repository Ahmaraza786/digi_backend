'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove the unique constraint from service_type column
    await queryInterface.removeConstraint('taxes', 'taxes_service_type_key');
  },

  down: async (queryInterface, Sequelize) => {
    // Add back the unique constraint (this will fail if there are duplicate service_types)
    await queryInterface.addConstraint('taxes', {
      fields: ['service_type'],
      type: 'unique',
      name: 'taxes_service_type_key'
    });
  }
};
