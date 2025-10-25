'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('tabs', [
      {
        name: 'dashboard',
        display_name: 'Dashboard',
        description: 'Main dashboard with analytics and overview',
        created_at: new Date()
      },
      {
        name: 'user',
        display_name: 'User Management',
        description: 'Manage system users and their profiles',
        created_at: new Date()
      },
      {
        name: 'role',
        display_name: 'Role Management',
        description: 'Manage user roles and permissions',
        created_at: new Date()
      },
      // {
      //   name: 'permissions',
      //   display_name: 'Permission Management',
      //   description: 'Manage system permissions',
      //   created_at: new Date()
      // },
      // {
      //   name: 'reports',
      //   display_name: 'Reports',
      //   description: 'Generate and view system reports',
      //   created_at: new Date()
      // },
      // {
      //   name: 'settings',
      //   display_name: 'Settings',
      //   description: 'System configuration and settings',
      //   created_at: new Date()
      // },
      {
        name: 'material',
        display_name: 'Material Management',
        description: 'Manage materials and services',
        created_at: new Date()
      },
      {
        name: 'customer',
        display_name: 'Customer Management',
        description: 'Manage customers and their information',
        created_at: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('tabs', null, {});
  }
};
