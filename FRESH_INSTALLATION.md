# Fresh Installation Guide

This guide ensures that new installations of the Digital World application will have the correct database schema from the start, without any enum value mismatches.

## Database Schema Status

The following enum values are now correctly configured for fresh installations:

### Invoice Status
- **Correct Values**: `unpaid`, `paid`
- **Default**: `unpaid`
- **Migration**: `20251006000000-create-invoices-table.js`

### Quotation Status  
- **Correct Values**: `pending`, `po_received`
- **Default**: `pending`
- **Migration**: `20250917185644-create-quotations-table.js`

### Purchase Order Status
- **Correct Values**: `pending`, `delivered`
- **Default**: `pending`
- **Migration**: `20250920072456-create-purchase-orders-table.js`

### Material Type
- **Correct Values**: `material`, `service`
- **Default**: `material`
- **Migration**: `20250915173839-create-materials-table.js`

## Fresh Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd digital_backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp env.example .env
   # Edit .env with your database credentials
   ```

4. **Create database**
   ```bash
   npx sequelize-cli db:create
   ```

5. **Run migrations**
   ```bash
   npx sequelize-cli db:migrate
   ```

6. **Seed initial data (optional)**
   ```bash
   npx sequelize-cli db:seed:all
   ```

7. **Start the application**
   ```bash
   npm start
   ```

## Verification

After running migrations, you can verify the correct enum values are in place:

```sql
-- Check invoice status enum
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_invoices_status');

-- Check quotation status enum  
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_quotations_status');

-- Check purchase order status enum
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_purchase_orders_status');
```

Expected results:
- Invoice status: `unpaid`, `paid`
- Quotation status: `pending`, `po_received`  
- Purchase order status: `pending`, `delivered`

## What Was Fixed

The original issue was that the invoice status enum was created with incorrect values (`not_paid`, `completed`) but the application code expected (`unpaid`, `paid`). This caused database errors when the dashboard tried to query for invoice statuses.

**Changes Made:**
1. **Consolidated all ALTER TABLE migrations** into their respective CREATE TABLE migrations
2. **Updated enum values** to be correct from the start:
   - Invoice status: `unpaid`, `paid` (was `not_paid`, `completed`)
   - Quotation status: `pending`, `po_received` (was `pending`, `delivered`, `successful`)
3. **Added all missing fields** directly to CREATE TABLE migrations:
   - Invoice: `with_hold_tax`, `cheque_amount`, `voucher_no`, `bank`, `deposit_date`, `dw_bank`
   - Customer: `ntn` field
   - Quotation: `title` field
   - Purchase Order: `customer_id`, `material_costs` fields
   - Tax: `effective_from`, `effective_to` fields, removed unique constraint
4. **Deleted all separate ALTER TABLE migration files** (10 files removed)
5. **Enhanced CREATE TABLE migrations** with all necessary fields and indexes

## Troubleshooting

If you encounter any enum-related errors:

1. **Check current enum values:**
   ```sql
   SELECT t.typname, e.enumlabel 
   FROM pg_type t 
   JOIN pg_enum e ON t.oid = e.enumtypid 
   WHERE t.typname LIKE 'enum_%'
   ORDER BY t.typname, e.enumsortorder;
   ```

2. **Reset database (if needed):**
   ```bash
   npx sequelize-cli db:drop
   npx sequelize-cli db:create
   npx sequelize-cli db:migrate
   ```

3. **Check migration status:**
   ```bash
   npx sequelize-cli db:migrate:status
   ```

## Notes

- All migrations are now designed to work correctly for fresh installations
- The dashboard will work properly with the correct enum values
- No manual database fixes are required for new installations
- Existing databases that were already migrated will continue to work (the enum values were already updated)
