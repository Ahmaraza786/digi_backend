'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('roles', [
      {
        name: 'Super Admin',
        description: 'Full system access with all permissions',
        is_default: false,
        created_at: new Date()
      },
      {
        name: 'Admin',
        description: 'Administrative access with most permissions',
        is_default: false,
        created_at: new Date()
      },
      {
        name: 'Manager',
        description: 'Management level access',
        is_default: false,
        created_at: new Date()
      },
      {
        name: 'User',
        description: 'Standard user access',
        is_default: true,
        created_at: new Date()
      },
      {
        name: 'Guest',
        description: 'Limited guest access',
        is_default: false,
        created_at: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', null, {});
  }
};
