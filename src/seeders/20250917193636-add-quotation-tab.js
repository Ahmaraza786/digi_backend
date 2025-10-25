'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add quotation tab
    await queryInterface.bulkInsert('tabs', [
      {
        name: 'quotation',
        display_name: 'Quotation Management',
        description: 'Manage quotations and their materials',
        created_at: new Date()
      }
    ], {});

    // Get the quotation tab ID (assuming it will be the next available ID)
    const [quotationTab] = await queryInterface.sequelize.query(
      "SELECT id FROM tabs WHERE name = 'quotation' ORDER BY id DESC LIMIT 1",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const quotationTabId = quotationTab.id;

    // Add quotation permissions for all roles
    await queryInterface.bulkInsert('role_permission_tab', [
      // Super Admin - Quotation tab - All permissions (create, read, update, delete)
      {
        role_id: 1, // Super Admin
        permission_id: 1, // create
        tab_id: quotationTabId, // quotation
        created_at: new Date()
      },
      {
        role_id: 1, // Super Admin
        permission_id: 2, // read
        tab_id: quotationTabId, // quotation
        created_at: new Date()
      },
      {
        role_id: 1, // Super Admin
        permission_id: 3, // update
        tab_id: quotationTabId, // quotation
        created_at: new Date()
      },
      {
        role_id: 1, // Super Admin
        permission_id: 4, // delete
        tab_id: quotationTabId, // quotation
        created_at: new Date()
      },
      // Admin - Quotation tab - Read, Create, Update permissions
      {
        role_id: 2, // Admin
        permission_id: 1, // create
        tab_id: quotationTabId, // quotation
        created_at: new Date()
      },
      {
        role_id: 2, // Admin
        permission_id: 2, // read
        tab_id: quotationTabId, // quotation
        created_at: new Date()
      },
      {
        role_id: 2, // Admin
        permission_id: 3, // update
        tab_id: quotationTabId, // quotation
        created_at: new Date()
      },
      // Manager - Quotation tab - Read permission only
      {
        role_id: 3, // Manager
        permission_id: 2, // read
        tab_id: quotationTabId, // quotation
        created_at: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    // Remove quotation permissions
    await queryInterface.bulkDelete('role_permission_tab', {
      tab_id: await queryInterface.sequelize.query(
        "SELECT id FROM tabs WHERE name = 'quotation'",
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      ).then(result => result[0]?.id)
    });

    // Remove quotation tab
    await queryInterface.bulkDelete('tabs', {
      name: 'quotation'
    });
  }
};