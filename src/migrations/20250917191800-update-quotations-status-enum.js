'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // First, add a temporary column to store the new status values
    await queryInterface.addColumn('quotations', 'status_temp', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Update the temporary column with new status values
    await queryInterface.sequelize.query(`
      UPDATE quotations 
      SET status_temp = CASE 
        WHEN status::text = 'draft' THEN 'pending'
        WHEN status::text = 'sent' THEN 'pending'
        WHEN status::text = 'approved' THEN 'successful'
        WHEN status::text = 'rejected' THEN 'pending'
        WHEN status::text = 'expired' THEN 'pending'
        ELSE 'pending'
      END
    `);

    // Drop the old status column
    await queryInterface.removeColumn('quotations', 'status');

    // Drop the old enum type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_quotations_status" CASCADE');

    // Create the new enum type
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_quotations_status" AS ENUM('pending', 'delivered', 'successful')
    `);

    // Add the new status column with the new enum
    await queryInterface.addColumn('quotations', 'status', {
      type: Sequelize.ENUM('pending', 'delivered', 'successful'),
      allowNull: false,
      defaultValue: 'pending'
    });

    // Update the new status column with values from temp column
    await queryInterface.sequelize.query(`
      UPDATE quotations 
      SET status = status_temp::enum_quotations_status
    `);

    // Remove the temporary column
    await queryInterface.removeColumn('quotations', 'status_temp');
  },

  async down (queryInterface, Sequelize) {
    // Add a temporary column to store the old status values
    await queryInterface.addColumn('quotations', 'status_temp', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Update the temporary column with old status values
    await queryInterface.sequelize.query(`
      UPDATE quotations 
      SET status_temp = CASE 
        WHEN status::text = 'pending' THEN 'draft'
        WHEN status::text = 'delivered' THEN 'sent'
        WHEN status::text = 'successful' THEN 'approved'
        ELSE 'draft'
      END
    `);

    // Drop the new status column
    await queryInterface.removeColumn('quotations', 'status');

    // Drop the new enum type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_quotations_status" CASCADE');

    // Create the old enum type
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_quotations_status" AS ENUM('draft', 'sent', 'approved', 'rejected', 'expired')
    `);

    // Add the old status column with the old enum
    await queryInterface.addColumn('quotations', 'status', {
      type: Sequelize.ENUM('draft', 'sent', 'approved', 'rejected', 'expired'),
      allowNull: false,
      defaultValue: 'draft'
    });

    // Update the old status column with values from temp column
    await queryInterface.sequelize.query(`
      UPDATE quotations 
      SET status = status_temp::enum_quotations_status
    `);

    // Remove the temporary column
    await queryInterface.removeColumn('quotations', 'status_temp');
  }
};