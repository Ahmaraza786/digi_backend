'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Find pieces we need
      const [perm] = await queryInterface.sequelize.query(
        `SELECT id FROM permissions WHERE name = 'read' LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );
      if (!perm) throw new Error("'read' permission not found");

      const [tab] = await queryInterface.sequelize.query(
        `SELECT id FROM tabs WHERE name = 'dashboard' LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );
      if (!tab) throw new Error("'dashboard' tab not found");

      const [superAdmin] = await queryInterface.sequelize.query(
        `SELECT id FROM roles WHERE LOWER(name) = 'super admin' LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );
      if (!superAdmin) throw new Error("'Super Admin' role not found");

      // Insert if missing
      await queryInterface.sequelize.query(
        `INSERT INTO role_permission_tab (role_id, permission_id, tab_id, created_at)
         SELECT :roleId, :permissionId, :tabId, :createdAt
         WHERE NOT EXISTS (
           SELECT 1 FROM role_permission_tab 
           WHERE role_id = :roleId AND permission_id = :permissionId AND tab_id = :tabId
         )`,
        {
          replacements: {
            roleId: superAdmin.id,
            permissionId: perm.id,
            tabId: tab.id,
            createdAt: new Date(),
          },
          transaction,
        }
      );

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  },

  async down (queryInterface, Sequelize) {
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
      const [superAdmin] = await queryInterface.sequelize.query(
        `SELECT id FROM roles WHERE LOWER(name) = 'super admin' LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (perm && tab && superAdmin) {
        await queryInterface.bulkDelete('role_permission_tab', {
          role_id: superAdmin.id,
          permission_id: perm.id,
          tab_id: tab.id,
        }, { transaction });
      }

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }
};


