'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('permissions', [
      {
        name: 'create',
        description: 'Permission to create new records',
        created_at: new Date()
      },
      {
        name: 'read',
        description: 'Permission to view/read records',
        created_at: new Date()
      },
      {
        name: 'update',
        description: 'Permission to update existing records',
        created_at: new Date()
      },
      {
        name: 'delete',
        description: 'Permission to delete records',
        created_at: new Date()
      },
      {
        name: 'export',
        description: 'Permission to export data',
        created_at: new Date()
      },
      {
        name: 'import',
        description: 'Permission to import data',
        created_at: new Date()
      },
      {
        name: 'manage',
        description: 'Full management permissions (all CRUD operations)',
        created_at: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('permissions', null, {});
  }
};
