'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add purchase order tab
    await queryInterface.bulkInsert('tabs', [
      {
        name: 'purchase_order',
        display_name: 'Purchase Order Management',
        description: 'Manage purchase orders and their details',
        created_at: new Date()
      }
    ], {});

    // Get the purchase order tab ID (assuming it will be the next available ID)
    const [purchaseOrderTab] = await queryInterface.sequelize.query(
      "SELECT id FROM tabs WHERE name = 'purchase_order' ORDER BY id DESC LIMIT 1",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const purchaseOrderTabId = purchaseOrderTab.id;

    // Add purchase order permissions for all roles
    await queryInterface.bulkInsert('role_permission_tab', [
      // Super Admin - Purchase Order tab - All permissions (create, read, update, delete)
      {
        role_id: 1, // Super Admin
        permission_id: 1, // create
        tab_id: purchaseOrderTabId, // purchase_order
        created_at: new Date()
      },
      {
        role_id: 1, // Super Admin
        permission_id: 2, // read
        tab_id: purchaseOrderTabId, // purchase_order
        created_at: new Date()
      },
      {
        role_id: 1, // Super Admin
        permission_id: 3, // update
        tab_id: purchaseOrderTabId, // purchase_order
        created_at: new Date()
      },
      {
        role_id: 1, // Super Admin
        permission_id: 4, // delete
        tab_id: purchaseOrderTabId, // purchase_order
        created_at: new Date()
      },
      // Admin - Purchase Order tab - Read, Create, Update permissions
      {
        role_id: 2, // Admin
        permission_id: 1, // create
        tab_id: purchaseOrderTabId, // purchase_order
        created_at: new Date()
      },
      {
        role_id: 2, // Admin
        permission_id: 2, // read
        tab_id: purchaseOrderTabId, // purchase_order
        created_at: new Date()
      },
      {
        role_id: 2, // Admin
        permission_id: 3, // update
        tab_id: purchaseOrderTabId, // purchase_order
        created_at: new Date()
      },
      // Manager - Purchase Order tab - Read permission only
      {
        role_id: 3, // Manager
        permission_id: 2, // read
        tab_id: purchaseOrderTabId, // purchase_order
        created_at: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    // Remove purchase order permissions
    await queryInterface.bulkDelete('role_permission_tab', {
      tab_id: await queryInterface.sequelize.query(
        "SELECT id FROM tabs WHERE name = 'purchase_order'",
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      ).then(result => result[0]?.id)
    });

    // Remove purchase order tab
    await queryInterface.bulkDelete('tabs', {
      name: 'purchase_order'
    });
  }
};
