#!/usr/bin/env node

/**
 * Database Schema Verification Script
 * 
 * This script verifies that the database schema has the correct enum values
 * for a fresh installation. Run this after migrations to ensure everything is correct.
 */

const { Sequelize } = require('sequelize');
const config = require('../src/config/config.json');

async function verifySchema() {
  console.log('🔍 Verifying database schema...\n');
  
  const sequelize = new Sequelize(config.development);
  
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.\n');
    
    // Check invoice status enum
    console.log('📋 Checking Invoice Status Enum:');
    const invoiceStatuses = await sequelize.query(
      "SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_invoices_status') ORDER BY enumsortorder;",
      { type: Sequelize.QueryTypes.SELECT }
    );
    console.log('   Values:', invoiceStatuses.map(row => row.enumlabel).join(', '));
    
    const expectedInvoiceStatuses = ['unpaid', 'paid'];
    const invoiceCorrect = JSON.stringify(invoiceStatuses.map(row => row.enumlabel)) === JSON.stringify(expectedInvoiceStatuses);
    console.log('   Status:', invoiceCorrect ? '✅ Correct' : '❌ Incorrect');
    console.log('   Expected:', expectedInvoiceStatuses.join(', '));
    console.log('');
    
    // Check quotation status enum
    console.log('📋 Checking Quotation Status Enum:');
    const quotationStatuses = await sequelize.query(
      "SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_quotations_status') ORDER BY enumsortorder;",
      { type: Sequelize.QueryTypes.SELECT }
    );
    console.log('   Values:', quotationStatuses.map(row => row.enumlabel).join(', '));
    
    const expectedQuotationStatuses = ['pending', 'po_received'];
    const quotationCorrect = JSON.stringify(quotationStatuses.map(row => row.enumlabel)) === JSON.stringify(expectedQuotationStatuses);
    console.log('   Status:', quotationCorrect ? '✅ Correct' : '❌ Incorrect');
    console.log('   Expected:', expectedQuotationStatuses.join(', '));
    console.log('');
    
    // Check purchase order status enum
    console.log('📋 Checking Purchase Order Status Enum:');
    const poStatuses = await sequelize.query(
      "SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_purchase_orders_status') ORDER BY enumsortorder;",
      { type: Sequelize.QueryTypes.SELECT }
    );
    console.log('   Values:', poStatuses.map(row => row.enumlabel).join(', '));
    
    const expectedPOStatuses = ['pending', 'delivered'];
    const poCorrect = JSON.stringify(poStatuses.map(row => row.enumlabel)) === JSON.stringify(expectedPOStatuses);
    console.log('   Status:', poCorrect ? '✅ Correct' : '❌ Incorrect');
    console.log('   Expected:', expectedPOStatuses.join(', '));
    console.log('');
    
    // Check material type enum
    console.log('📋 Checking Material Type Enum:');
    const materialTypes = await sequelize.query(
      "SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_materials_material_type') ORDER BY enumsortorder;",
      { type: Sequelize.QueryTypes.SELECT }
    );
    console.log('   Values:', materialTypes.map(row => row.enumlabel).join(', '));
    
    const expectedMaterialTypes = ['material', 'service'];
    const materialCorrect = JSON.stringify(materialTypes.map(row => row.enumlabel)) === JSON.stringify(expectedMaterialTypes);
    console.log('   Status:', materialCorrect ? '✅ Correct' : '❌ Incorrect');
    console.log('   Expected:', expectedMaterialTypes.join(', '));
    console.log('');
    
    // Overall status
    const allCorrect = invoiceCorrect && quotationCorrect && poCorrect && materialCorrect;
    
    if (allCorrect) {
      console.log('🎉 All enum values are correct! Database schema is ready for use.');
      process.exit(0);
    } else {
      console.log('❌ Some enum values are incorrect. Please check the migration files.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error verifying schema:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the verification
verifySchema();
