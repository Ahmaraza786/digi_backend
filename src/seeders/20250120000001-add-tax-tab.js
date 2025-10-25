'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add tax tab
    await queryInterface.bulkInsert('tabs', [
      {
        name: 'tax',
        display_name: 'Tax',
        description: 'Manage tax percentages for different service types',
        created_at: new Date()
      }
    ], {});

    // Get the tax tab ID
    const [taxTab] = await queryInterface.sequelize.query(
      "SELECT id FROM tabs WHERE name = 'tax'",
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Add tax permissions
    await queryInterface.bulkInsert('permissions', [
      {
        name: 'tax_read',
        created_at: new Date()
      },
      {
        name: 'tax_update',
        created_at: new Date()
      }
    ], {});

    // Get permission IDs
    const [taxReadPermission] = await queryInterface.sequelize.query(
      "SELECT id FROM permissions WHERE name = 'tax_read'",
      { type: Sequelize.QueryTypes.SELECT }
    );

    const [taxUpdatePermission] = await queryInterface.sequelize.query(
      "SELECT id FROM permissions WHERE name = 'tax_update'",
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Get superadmin role ID
    const [superadminRole] = await queryInterface.sequelize.query(
      "SELECT id FROM roles WHERE name = 'superadmin'",
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Add role-permission-tab associations for superadmin
    await queryInterface.bulkInsert('role_permission_tab', [
      {
        role_id: superadminRole.id,
        permission_id: taxReadPermission.id,
        tab_id: taxTab.id,
        created_at: new Date()
      },
      {
        role_id: superadminRole.id,
        permission_id: taxUpdatePermission.id,
        tab_id: taxTab.id,
        created_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    // Remove role-permission-tab associations
    await queryInterface.bulkDelete('role_permission_tab', {
      tab_id: await queryInterface.sequelize.query(
        "SELECT id FROM tabs WHERE name = 'tax'",
        { type: Sequelize.QueryTypes.SELECT }
      ).then(result => result[0]?.id)
    });

    // Remove permissions
    await queryInterface.bulkDelete('permissions', {
      name: ['tax_read', 'tax_update']
    });

    // Remove tab
    await queryInterface.bulkDelete('tabs', {
      name: 'tax'
    });
  }
};
