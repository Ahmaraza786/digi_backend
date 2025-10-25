'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('taxes', [
      {
        service_type: 'material',
        tax_percent: 18.00,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        service_type: 'service',
        tax_percent: 16.00,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('taxes', null, {});
  }
};
