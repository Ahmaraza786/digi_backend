'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add employee permissions for Super Admin (role_id: 1)
    await queryInterface.bulkInsert('role_permission_tab', [
      // Super Admin - Employee tab - All permissions (create, read, update, delete)
      {
        role_id: 1, // Super Admin
        permission_id: 1, // create
        tab_id: 32, // employee
        created_at: new Date()
      },
      {
        role_id: 1, // Super Admin
        permission_id: 2, // read
        tab_id: 32, // employee
        created_at: new Date()
      },
      {
        role_id: 1, // Super Admin
        permission_id: 3, // update
        tab_id: 32, // employee
        created_at: new Date()
      },
      {
        role_id: 1, // Super Admin
        permission_id: 4, // delete
        tab_id: 32, // employee
        created_at: new Date()
      },
      // Super Admin - Employee Salary tab - All permissions (create, read, update, delete)
      {
        role_id: 1, // Super Admin
        permission_id: 1, // create
        tab_id: 33, // employee_salary
        created_at: new Date()
      },
      {
        role_id: 1, // Super Admin
        permission_id: 2, // read
        tab_id: 33, // employee_salary
        created_at: new Date()
      },
      {
        role_id: 1, // Super Admin
        permission_id: 3, // update
        tab_id: 33, // employee_salary
        created_at: new Date()
      },
      {
        role_id: 1, // Super Admin
        permission_id: 4, // delete
        tab_id: 33, // employee_salary
        created_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    // Remove employee permissions
    await queryInterface.bulkDelete('role_permission_tab', {
      role_id: 1,
      tab_id: [32, 33] // employee and employee_salary
    }, {});
  }
};
