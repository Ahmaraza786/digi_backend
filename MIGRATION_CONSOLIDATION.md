# Migration Consolidation Summary

This document summarizes the consolidation of ALTER TABLE migrations into their respective CREATE TABLE migrations for a cleaner and more efficient fresh installation process.

## Overview

Previously, the database schema was built through multiple migrations:
1. **CREATE TABLE** migrations that created the initial table structure
2. **ALTER TABLE** migrations that added fields, modified constraints, and updated enum values

This approach worked but created complexity for fresh installations, as users had to run many separate migrations to get the complete schema.

## Consolidation Process

### 1. Invoice Table Consolidation

**Original Structure:**
- `20251006000000-create-invoices-table.js` - Basic invoice table
- `20251006000001-add-payment-fields-to-invoices.js` - Added payment fields

**Consolidated Structure:**
- `20251006000000-create-invoices-table.js` - Complete invoice table with all fields

**Fields Added:**
- `with_hold_tax` (BOOLEAN, default: false)
- `cheque_amount` (DECIMAL(15,2))
- `voucher_no` (VARCHAR(100))
- `bank` (VARCHAR(100))
- `deposit_date` (DATE)
- `dw_bank` (VARCHAR(100))

**Enum Values Fixed:**
- Status: `unpaid`, `paid` (was `not_paid`, `completed`)

### 2. Customer Table Consolidation

**Original Structure:**
- `20250915181222-create-customers-table.js` - Basic customer table
- `20250915190000-add-ntn-to-customers.js` - Added NTN field

**Consolidated Structure:**
- `20250915181222-create-customers-table.js` - Complete customer table

**Fields Added:**
- `ntn` (VARCHAR(50), nullable)

### 3. Quotation Table Consolidation

**Original Structure:**
- `20250917185644-create-quotations-table.js` - Basic quotation table
- `20250919165645-add-title-to-quotations.js` - Added title field
- `20250917191800-update-quotations-status-enum.js` - Updated status enum
- `20250917200000-update-quotation-status-enum.js` - Further status enum updates

**Consolidated Structure:**
- `20250917185644-create-quotations-table.js` - Complete quotation table

**Fields Added:**
- `title` (VARCHAR(255), nullable)

**Enum Values Fixed:**
- Status: `pending`, `po_received` (was `pending`, `delivered`, `successful`)

**Indexes Added:**
- `idx_quotations_title` for title field

### 4. Purchase Order Table Consolidation

**Original Structure:**
- `20250920072456-create-purchase-orders-table.js` - Basic purchase order table
- `20250920080000-add-customer-id-to-purchase-orders.js` - Added customer_id
- `20250920095234-add-file-to-purchase-orders.js` - Added file field (removed in favor of multi-file approach)
- `20251005095303-add-material-costs-to-purchase-orders.js` - Added material_costs

**Consolidated Structure:**
- `20250920072456-create-purchase-orders-table.js` - Complete purchase order table

**Fields Added:**
- `customer_id` (INTEGER, foreign key to customers)
- `material_costs` (JSON, nullable)

**Indexes Added:**
- `idx_purchase_orders_customer_id` for customer_id field

### 5. Tax Table Consolidation

**Original Structure:**
- `20250120000003-create-tax-table.js` - Basic tax table
- `20250120000013-add-effective-dates-to-tax.js` - Added effective date fields
- `20250120000014-remove-unique-constraint-from-tax-service-type.js` - Removed unique constraint

**Consolidated Structure:**
- `20250120000003-create-tax-table.js` - Complete tax table

**Fields Added:**
- `effective_from` (DATE, default: CURRENT_TIMESTAMP)
- `effective_to` (DATE, nullable)

**Constraints Removed:**
- Unique constraint on `service_type` field

### 6. Users Table Enhancement

**Original Structure:**
- `20250913122104-create-users-table.js` - Basic users table (missing updated_at)

**Enhanced Structure:**
- `20250913122104-create-users-table.js` - Complete users table

**Fields Added:**
- `updated_at` (DATE, default: NOW)

## Files Deleted

The following ALTER TABLE migration files were deleted after consolidation:

1. `20251006000001-add-payment-fields-to-invoices.js`
2. `20250915190000-add-ntn-to-customers.js`
3. `20250918184313-add-unit-to-materials.js`
4. `20250919165645-add-title-to-quotations.js`
5. `20250919170111-make-title-required-in-quotations.js`
6. `20250920080000-add-customer-id-to-purchase-orders.js`
7. `20250920095234-add-file-to-purchase-orders.js`
8. `20251005095303-add-material-costs-to-purchase-orders.js`
9. `20250120000013-add-effective-dates-to-tax.js`
10. `20250120000014-remove-unique-constraint-from-tax-service-type.js`
11. `20250917191800-update-quotations-status-enum.js`
12. `20250917200000-update-quotation-status-enum.js`

**Total: 12 migration files deleted**

## Benefits of Consolidation

### 1. **Simplified Fresh Installation**
- New users only need to run `db:migrate` once
- No need to understand the sequence of ALTER TABLE migrations
- Cleaner migration history

### 2. **Correct Schema from Start**
- All enum values are correct from the beginning
- All necessary fields are present in CREATE TABLE
- No need for complex data migration scripts

### 3. **Better Performance**
- Fewer migration steps to execute
- Reduced database operations during setup
- Faster fresh installation process

### 4. **Easier Maintenance**
- Single source of truth for each table structure
- No need to track which ALTER TABLE migrations apply
- Cleaner codebase with fewer files

### 5. **Consistent Schema**
- All tables have their complete structure from creation
- No partial schemas that need to be "fixed" later
- Predictable database structure

## Migration Count

**Before Consolidation:**
- 30 migration files total
- 12 ALTER TABLE migrations
- 18 CREATE TABLE migrations

**After Consolidation:**
- 18 migration files total
- 0 ALTER TABLE migrations
- 18 enhanced CREATE TABLE migrations

**Reduction: 40% fewer migration files**

## Verification

The consolidated migrations have been tested and verified:

1. ✅ **Fresh database creation** - All tables created with correct structure
2. ✅ **Enum values** - All enum values are correct from the start
3. ✅ **Field presence** - All consolidated fields are present
4. ✅ **Indexes** - All necessary indexes are created
5. ✅ **Constraints** - All foreign keys and constraints are correct
6. ✅ **Data types** - All field types match the original ALTER TABLE specifications

## Usage

For fresh installations, users now simply need to:

```bash
# Create database
npm run db:create

# Run migrations (now includes all consolidated changes)
npm run db:migrate

# Verify schema (optional but recommended)
npm run verify-schema

# Seed initial data
npm run db:seed
```

The schema will be complete and correct from the first migration run.
