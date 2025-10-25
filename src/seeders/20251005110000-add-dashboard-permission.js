'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Link existing 'read' permission to the dashboard tab for admin role
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [perm] = await queryInterface.sequelize.query(
        `SELECT id FROM permissions WHERE name = 'read' LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );
      if (!perm) throw new Error("'read' permission not found. Run demo-permissions seeder first.");

      const [tab] = await queryInterface.sequelize.query(
        `SELECT id FROM tabs WHERE name = 'dashboard' LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );
      if (!tab) throw new Error("'dashboard' tab not found. Run demo-tabs seeder first.");

      const roles = await queryInterface.sequelize.query(
        `SELECT id, name FROM roles WHERE LOWER(name) IN ('admin','super admin') ORDER BY id ASC`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );
      if (!roles || roles.length === 0) throw new Error('Admin/Super Admin roles not found. Run demo-roles seeder first.');

      for (const r of roles) {
        await queryInterface.sequelize.query(
          `INSERT INTO role_permission_tab (role_id, permission_id, tab_id, created_at)
           VALUES (:roleId, :permissionId, :tabId, :createdAt)
           ON CONFLICT (role_id, permission_id, tab_id) DO NOTHING`,
          {
            replacements: {
              roleId: r.id,
              permissionId: perm.id,
              tabId: tab.id,
              createdAt: new Date(),
            },
            transaction,
          }
        );
      }

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  },

  async down (queryInterface, Sequelize) {
    // Remove the specific link between admin, read, and dashboard tab
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [perm] = await queryInterface.sequelize.query(
        `SELECT id FROM permissions WHERE name = 'read' LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );
      const [tab] = await queryInterface.sequelize.query(
        `SELECT id FROM tabs WHERE name = 'dashboard' LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );
      const roles = await queryInterface.sequelize.query(
        `SELECT id FROM roles WHERE LOWER(name) IN ('admin','super admin') ORDER BY id ASC`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (perm && tab && roles && roles.length) {
        for (const r of roles) {
          await queryInterface.bulkDelete('role_permission_tab', { role_id: r.id, permission_id: perm.id, tab_id: tab.id }, { transaction });
        }
      }
      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }
};


