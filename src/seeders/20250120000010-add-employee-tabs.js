'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add Employee Management tab
    await queryInterface.bulkInsert('tabs', [
      {
        name: 'employee',
        display_name: 'Employee Management',
        description: 'Manage employee information and basic salary',
        created_at: new Date()
      },
      {
        name: 'employee_salary',
        display_name: 'Salaries & Wages',
        description: 'Manage monthly payroll and salary processing',
        created_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('tabs', {
      name: ['employee', 'employee_salary']
    }, {});
  }
};
