'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Get tab IDs dynamically
    const [userTab] = await queryInterface.sequelize.query(
      "SELECT id FROM tabs WHERE name = 'user'",
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const [roleTab] = await queryInterface.sequelize.query(
      "SELECT id FROM tabs WHERE name = 'role'",
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const [materialTab] = await queryInterface.sequelize.query(
      "SELECT id FROM tabs WHERE name = 'material'",
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const [customerTab] = await queryInterface.sequelize.query(
      "SELECT id FROM tabs WHERE name = 'customer'",
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Only proceed if all required tabs exist
    if (userTab && roleTab && materialTab && customerTab) {
      await queryInterface.bulkInsert('role_permission_tab', [
        // Super Admin - User tab - All permissions (create, read, update, delete)
        {
          role_id: 1, // Super Admin
          permission_id: 1, // create
          tab_id: userTab.id, // user
          created_at: new Date()
        },
        {
          role_id: 1, // Super Admin
          permission_id: 2, // read
          tab_id: userTab.id, // user
          created_at: new Date()
        },
        {
          role_id: 1, // Super Admin
          permission_id: 3, // update
          tab_id: userTab.id, // user
          created_at: new Date()
        },
        {
          role_id: 1, // Super Admin
          permission_id: 4, // delete
          tab_id: userTab.id, // user
          created_at: new Date()
        },
        // Super Admin - Role tab - All permissions (create, read, update, delete)
        {
          role_id: 1, // Super Admin
          permission_id: 1, // create
          tab_id: roleTab.id, // role
          created_at: new Date()
        },
        {
          role_id: 1, // Super Admin
          permission_id: 2, // read
          tab_id: roleTab.id, // role
          created_at: new Date()
        },
        {
          role_id: 1, // Super Admin
          permission_id: 3, // update
          tab_id: roleTab.id, // role
          created_at: new Date()
        },
        {
          role_id: 1, // Super Admin
          permission_id: 4, // delete
          tab_id: roleTab.id, // role
          created_at: new Date()
        },
        // Admin - User tab - Read, Create, Update permissions
        {
          role_id: 2, // Admin
          permission_id: 1, // create
          tab_id: userTab.id, // user
          created_at: new Date()
        },
        {
          role_id: 2, // Admin
          permission_id: 2, // read
          tab_id: userTab.id, // user
          created_at: new Date()
        },
        {
          role_id: 2, // Admin
          permission_id: 3, // update
          tab_id: userTab.id, // user
          created_at: new Date()
        },
        // Super Admin - Material tab - All permissions (create, read, update, delete)
        {
          role_id: 1, // Super Admin
          permission_id: 1, // create
          tab_id: materialTab.id, // material
          created_at: new Date()
        },
        {
          role_id: 1, // Super Admin
          permission_id: 2, // read
          tab_id: materialTab.id, // material
          created_at: new Date()
        },
        {
          role_id: 1, // Super Admin
          permission_id: 3, // update
          tab_id: materialTab.id, // material
          created_at: new Date()
        },
        {
          role_id: 1, // Super Admin
          permission_id: 4, // delete
          tab_id: materialTab.id, // material
          created_at: new Date()
        },
        // Admin - Material tab - Read, Create, Update permissions
        {
          role_id: 2, // Admin
          permission_id: 1, // create
          tab_id: materialTab.id, // material
          created_at: new Date()
        },
        {
          role_id: 2, // Admin
          permission_id: 2, // read
          tab_id: materialTab.id, // material
          created_at: new Date()
        },
        {
          role_id: 2, // Admin
          permission_id: 3, // update
          tab_id: materialTab.id, // material
          created_at: new Date()
        },
        // Manager - User tab - Read permission only
        {
          role_id: 3, // Manager
          permission_id: 2, // read
          tab_id: userTab.id, // user
          created_at: new Date()
        },
        // Manager - Material tab - Read permission only
        {
          role_id: 3, // Manager
          permission_id: 2, // read
          tab_id: materialTab.id, // material
          created_at: new Date()
        },
        // Super Admin - Customer tab - All permissions (create, read, update, delete)
        {
          role_id: 1, // Super Admin
          permission_id: 1, // create
          tab_id: customerTab.id, // customer
          created_at: new Date()
        },
        {
          role_id: 1, // Super Admin
          permission_id: 2, // read
          tab_id: customerTab.id, // customer
          created_at: new Date()
        },
        {
          role_id: 1, // Super Admin
          permission_id: 3, // update
          tab_id: customerTab.id, // customer
          created_at: new Date()
        },
        {
          role_id: 1, // Super Admin
          permission_id: 4, // delete
          tab_id: customerTab.id, // customer
          created_at: new Date()
        },
        // Admin - Customer tab - Read, Create, Update permissions
        {
          role_id: 2, // Admin
          permission_id: 1, // create
          tab_id: customerTab.id, // customer
          created_at: new Date()
        },
        {
          role_id: 2, // Admin
          permission_id: 2, // read
          tab_id: customerTab.id, // customer
          created_at: new Date()
        },
        {
          role_id: 2, // Admin
          permission_id: 3, // update
          tab_id: customerTab.id, // customer
          created_at: new Date()
        },
        // Manager - Customer tab - Read permission only
        {
          role_id: 3, // Manager
          permission_id: 2, // read
          tab_id: customerTab.id, // customer
          created_at: new Date()
        }
      ], {});
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('role_permission_tab', null, {});
  }
};
