'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Step 1: Create new enum type
      await queryInterface.sequelize.query(`
        CREATE TYPE enum_quotations_status_new AS ENUM ('pending', 'po_received');
      `, { transaction });

      // Step 2: Add temporary column with new enum
      await queryInterface.addColumn('quotations', 'status_new', {
        type: Sequelize.ENUM('pending', 'po_received'),
        allowNull: false,
        defaultValue: 'pending'
      }, { transaction });

      // Step 3: Update the new column with mapped values
      await queryInterface.sequelize.query(`
        UPDATE quotations 
        SET status_new = CASE 
          WHEN status = 'pending' THEN 'pending'::enum_quotations_status_new
          WHEN status IN ('delivered', 'successful') THEN 'po_received'::enum_quotations_status_new
          ELSE 'pending'::enum_quotations_status_new
        END;
      `, { transaction });

      // Step 4: Drop the old column
      await queryInterface.removeColumn('quotations', 'status', { transaction });

      // Step 5: Rename the new column to the original name
      await queryInterface.renameColumn('quotations', 'status_new', 'status', { transaction });

      // Step 6: Drop the old enum type
      await queryInterface.sequelize.query(`
        DROP TYPE enum_quotations_status;
      `, { transaction });

      // Step 7: Rename the new enum type to the original name
      await queryInterface.sequelize.query(`
        ALTER TYPE enum_quotations_status_new RENAME TO enum_quotations_status;
      `, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Create old enum type
      await queryInterface.sequelize.query(`
        CREATE TYPE enum_quotations_status_old AS ENUM ('pending', 'delivered', 'successful');
      `, { transaction });

      // Add temporary column with old enum
      await queryInterface.addColumn('quotations', 'status_old', {
        type: Sequelize.ENUM('pending', 'delivered', 'successful'),
        allowNull: false,
        defaultValue: 'pending'
      }, { transaction });

      // Map values back (po_received becomes delivered)
      await queryInterface.sequelize.query(`
        UPDATE quotations 
        SET status_old = CASE 
          WHEN status = 'pending' THEN 'pending'::enum_quotations_status_old
          WHEN status = 'po_received' THEN 'delivered'::enum_quotations_status_old
          ELSE 'pending'::enum_quotations_status_old
        END;
      `, { transaction });

      // Drop the current column
      await queryInterface.removeColumn('quotations', 'status', { transaction });

      // Rename the old column back
      await queryInterface.renameColumn('quotations', 'status_old', 'status', { transaction });

      // Drop the new enum type
      await queryInterface.sequelize.query(`
        DROP TYPE enum_quotations_status;
      `, { transaction });

      // Rename old enum type back
      await queryInterface.sequelize.query(`
        ALTER TYPE enum_quotations_status_old RENAME TO enum_quotations_status;
      `, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
