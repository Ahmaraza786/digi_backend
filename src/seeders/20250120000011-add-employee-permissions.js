'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get tab IDs dynamically
    const [employeeTab] = await queryInterface.sequelize.query(
      "SELECT id FROM tabs WHERE name = 'employee'",
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const [employeeSalaryTab] = await queryInterface.sequelize.query(
      "SELECT id FROM tabs WHERE name = 'employee_salary'",
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Only proceed if both tabs exist
    if (employeeTab && employeeSalaryTab) {
      await queryInterface.bulkInsert('role_permission_tab', [
        // Super Admin - Employee tab - All permissions (create, read, update, delete)
        {
          role_id: 1, // Super Admin
          permission_id: 1, // create
          tab_id: employeeTab.id, // employee
          created_at: new Date()
        },
        {
          role_id: 1, // Super Admin
          permission_id: 2, // read
          tab_id: employeeTab.id, // employee
          created_at: new Date()
        },
        {
          role_id: 1, // Super Admin
          permission_id: 3, // update
          tab_id: employeeTab.id, // employee
          created_at: new Date()
        },
        {
          role_id: 1, // Super Admin
          permission_id: 4, // delete
          tab_id: employeeTab.id, // employee
          created_at: new Date()
        },
        // Super Admin - Employee Salary tab - All permissions (create, read, update, delete)
        {
          role_id: 1, // Super Admin
          permission_id: 1, // create
          tab_id: employeeSalaryTab.id, // employee_salary
          created_at: new Date()
        },
        {
          role_id: 1, // Super Admin
          permission_id: 2, // read
          tab_id: employeeSalaryTab.id, // employee_salary
          created_at: new Date()
        },
        {
          role_id: 1, // Super Admin
          permission_id: 3, // update
          tab_id: employeeSalaryTab.id, // employee_salary
          created_at: new Date()
        },
        {
          role_id: 1, // Super Admin
          permission_id: 4, // delete
          tab_id: employeeSalaryTab.id, // employee_salary
          created_at: new Date()
        }
      ], {});
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove employee permissions
    await queryInterface.bulkDelete('role_permission_tab', {
      role_id: 1,
      tab_id: [32, 33] // employee and employee_salary
    }, {});
  }
};
