'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    
    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', saltRounds);
    const userPassword = await bcrypt.hash('user123', saltRounds);
    
    await queryInterface.bulkInsert('users', [
      {
        username: 'superadmin',
        email: 'superadmin@example.com',
        password: adminPassword,
        role_id: 1, // Super Admin role
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        username: 'admin',
        email: 'admin@example.com',
        password: adminPassword,
        role_id: 2, // Admin role
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        username: 'manager',
        email: 'manager@example.com',
        password: userPassword,
        role_id: 3, // Manager role
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        username: 'testuser',
        email: 'user@example.com',
        password: userPassword,
        role_id: 4, // User role
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};
