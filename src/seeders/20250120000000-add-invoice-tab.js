'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add invoice tab
    await queryInterface.bulkInsert('tabs', [
      {
        name: 'invoice',
        display_name: 'Invoices',
        description: 'Manage invoices and billing',
        created_at: new Date()
      }
    ], {});

    // Get the invoice tab ID
    const [invoiceTab] = await queryInterface.sequelize.query(
      "SELECT id FROM tabs WHERE name = 'invoice'",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (invoiceTab) {
      // Add permissions for invoice tab
      await queryInterface.bulkInsert('permissions', [
        {
          name: 'invoice_read',
          description: 'Permission to read/view invoices',
          created_at: new Date()
        },
        {
          name: 'invoice_create',
          description: 'Permission to create new invoices',
          created_at: new Date()
        },
        {
          name: 'invoice_update',
          description: 'Permission to update existing invoices',
          created_at: new Date()
        },
        {
          name: 'invoice_delete',
          description: 'Permission to delete invoices',
          created_at: new Date()
        }
      ], {});

      // Get admin role ID
      const [adminRole] = await queryInterface.sequelize.query(
        "SELECT id FROM roles WHERE name = 'admin'",
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (adminRole) {
        // Get all invoice permissions
        const invoicePermissions = await queryInterface.sequelize.query(
          "SELECT id FROM permissions WHERE name LIKE 'invoice_%'",
          { type: Sequelize.QueryTypes.SELECT }
        );

        // Assign all invoice permissions to admin role
        const rolePermissionTabData = invoicePermissions.map(permission => ({
          role_id: adminRole.id,
          permission_id: permission.id,
          tab_id: invoiceTab.id,
          created_at: new Date()
        }));

        if (rolePermissionTabData.length > 0) {
          await queryInterface.bulkInsert('role_permission_tab', rolePermissionTabData, {});
        }
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove role permission tabs for invoice
    await queryInterface.sequelize.query(
      "DELETE FROM role_permission_tab WHERE tab_id IN (SELECT id FROM tabs WHERE name = 'invoice')"
    );

    // Remove invoice permissions
    await queryInterface.sequelize.query(
      "DELETE FROM permissions WHERE name LIKE 'invoice_%'"
    );

    // Remove invoice tab
    await queryInterface.sequelize.query(
      "DELETE FROM tabs WHERE name = 'invoice'"
    );
  }
};
