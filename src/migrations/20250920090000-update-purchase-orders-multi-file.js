'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, let's create a new table for purchase order files
    await queryInterface.createTable('purchase_order_files', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      purchase_order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'purchase_orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      file_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      file_path: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      file_size: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      file_type: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      uploaded_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('purchase_order_files', ['purchase_order_id'], {
      name: 'idx_purchase_order_files_po_id'
    });

    await queryInterface.addIndex('purchase_order_files', ['uploaded_by'], {
      name: 'idx_purchase_order_files_uploaded_by'
    });

    // Note: Data migration removed as purchase_order_file column doesn't exist
    // This migration only creates the new table structure for multi-file support
  },

  down: async (queryInterface, Sequelize) => {
    // Add back the purchase_order_file column
    await queryInterface.addColumn('purchase_orders', 'purchase_order_file', {
      type: Sequelize.STRING(500),
      allowNull: true
    });

    // Migrate data back (take the first file from each purchase order)
    await queryInterface.sequelize.query(`
      UPDATE purchase_orders 
      SET purchase_order_file = (
        SELECT file_path 
        FROM purchase_order_files 
        WHERE purchase_order_files.purchase_order_id = purchase_orders.id 
        ORDER BY created_at ASC 
        LIMIT 1
      )
      WHERE EXISTS (
        SELECT 1 FROM purchase_order_files 
        WHERE purchase_order_files.purchase_order_id = purchase_orders.id
      )
    `);

    // Drop the new table
    await queryInterface.dropTable('purchase_order_files');
  }
};
