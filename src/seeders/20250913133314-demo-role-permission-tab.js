'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Give Super Admin (role_id: 1) all CRUD permissions for users and roles tabs
    await queryInterface.bulkInsert('role_permission_tab', [
      // Super Admin - User tab - All permissions (create, read, update, delete)
      {
        role_id: 1, // Super Admin
        permission_id: 1, // create
        tab_id: 15, // user
        created_at: new Date()
      },
      {
        role_id: 1, // Super Admin
        permission_id: 2, // read
        tab_id: 15, // user
        created_at: new Date()
      },
      {
        role_id: 1, // Super Admin
        permission_id: 3, // update
        tab_id: 15, // user
        created_at: new Date()
      },
      {
        role_id: 1, // Super Admin
        permission_id: 4, // delete
        tab_id: 15, // user
        created_at: new Date()
      },
      // Super Admin - Role tab - All permissions (create, read, update, delete)
      {
        role_id: 1, // Super Admin
        permission_id: 1, // create
        tab_id: 16, // role
        created_at: new Date()
      },
      {
        role_id: 1, // Super Admin
        permission_id: 2, // read
        tab_id: 16, // role
        created_at: new Date()
      },
      {
        role_id: 1, // Super Admin
        permission_id: 3, // update
        tab_id: 16, // role
        created_at: new Date()
      },
      {
        role_id: 1, // Super Admin
        permission_id: 4, // delete
        tab_id: 16, // role
        created_at: new Date()
      },
      // Admin - User tab - Read, Create, Update permissions
      {
        role_id: 2, // Admin
        permission_id: 1, // create
        tab_id: 15, // user
        created_at: new Date()
      },
      {
        role_id: 2, // Admin
        permission_id: 2, // read
        tab_id: 15, // user
        created_at: new Date()
      },
      {
        role_id: 2, // Admin
        permission_id: 3, // update
        tab_id: 15, // user
        created_at: new Date()
      },
      // Super Admin - Material tab - All permissions (create, read, update, delete)
      {
        role_id: 1, // Super Admin
        permission_id: 1, // create
        tab_id: 20, // material
        created_at: new Date()
      },
      {
        role_id: 1, // Super Admin
        permission_id: 2, // read
        tab_id: 20, // material
        created_at: new Date()
      },
      {
        role_id: 1, // Super Admin
        permission_id: 3, // update
        tab_id: 20, // material
        created_at: new Date()
      },
      {
        role_id: 1, // Super Admin
        permission_id: 4, // delete
        tab_id: 20, // material
        created_at: new Date()
      },
      // Admin - Material tab - Read, Create, Update permissions
      {
        role_id: 2, // Admin
        permission_id: 1, // create
        tab_id: 20, // material
        created_at: new Date()
      },
      {
        role_id: 2, // Admin
        permission_id: 2, // read
        tab_id: 20, // material
        created_at: new Date()
      },
      {
        role_id: 2, // Admin
        permission_id: 3, // update
        tab_id: 20, // material
        created_at: new Date()
      },
      // Manager - User tab - Read permission only
      {
        role_id: 3, // Manager
        permission_id: 2, // read
        tab_id: 15, // user
        created_at: new Date()
      },
      // Manager - Material tab - Read permission only
      {
        role_id: 3, // Manager
        permission_id: 2, // read
        tab_id: 20, // material
        created_at: new Date()
      },
      // Super Admin - Customer tab - All permissions (create, read, update, delete)
      {
        role_id: 1, // Super Admin
        permission_id: 1, // create
        tab_id: 21, // customer
        created_at: new Date()
      },
      {
        role_id: 1, // Super Admin
        permission_id: 2, // read
        tab_id: 21, // customer
        created_at: new Date()
      },
      {
        role_id: 1, // Super Admin
        permission_id: 3, // update
        tab_id: 21, // customer
        created_at: new Date()
      },
      {
        role_id: 1, // Super Admin
        permission_id: 4, // delete
        tab_id: 21, // customer
        created_at: new Date()
      },
      // Admin - Customer tab - Read, Create, Update permissions
      {
        role_id: 2, // Admin
        permission_id: 1, // create
        tab_id: 21, // customer
        created_at: new Date()
      },
      {
        role_id: 2, // Admin
        permission_id: 2, // read
        tab_id: 21, // customer
        created_at: new Date()
      },
      {
        role_id: 2, // Admin
        permission_id: 3, // update
        tab_id: 21, // customer
        created_at: new Date()
      },
      // Manager - Customer tab - Read permission only
      {
        role_id: 3, // Manager
        permission_id: 2, // read
        tab_id: 21, // customer
        created_at: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('role_permission_tab', null, {});
  }
};
