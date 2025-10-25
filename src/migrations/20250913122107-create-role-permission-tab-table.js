'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('role_permission_tab', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      role_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      permission_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'permissions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tab_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tabs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add unique constraint
    await queryInterface.addConstraint('role_permission_tab', {
      fields: ['role_id', 'permission_id', 'tab_id'],
      type: 'unique',
      name: 'unique_role_permission_tab'
    });

    // Add indexes
    await queryInterface.addIndex('role_permission_tab', ['role_id'], {
      name: 'idx_role_permission_tab_role'
    });
    
    await queryInterface.addIndex('role_permission_tab', ['permission_id'], {
      name: 'idx_role_permission_tab_permission'
    });
    
    await queryInterface.addIndex('role_permission_tab', ['tab_id'], {
      name: 'idx_role_permission_tab_tab'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('role_permission_tab');
  }
};
