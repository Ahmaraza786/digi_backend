'use strict';
const { Invoice, PurchaseOrder, Quotation, Expense, EmployeeSalary, sequelize } = require('../models');
const { Op } = require('sequelize');

// Helper to build date range filter
function buildDateRange(startDate, endDate) {
  if (!startDate && !endDate) return undefined;
  const range = {};
  if (startDate) range[Op.gte] = new Date(startDate);
  if (endDate) range[Op.lte] = new Date(endDate);
  return range;
}

const getDashboardSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const invoiceDateFilter = buildDateRange(startDate, endDate);
    const poDateFilter = buildDateRange(startDate, endDate);

    const invoiceWhere = {};
    if (invoiceDateFilter) invoiceWhere.created_at = invoiceDateFilter;

    const poWhereBase = {};
    if (poDateFilter) poWhereBase.created_at = poDateFilter;

    // Invoices counts with error handling
    const [
      invoicesTotal,
      invoicesPaid,
      invoicesUnpaid,
    ] = await Promise.all([
      Invoice.count({ where: invoiceWhere }).catch(() => 0),
      Invoice.count({ where: { ...invoiceWhere, status: 'paid' } }).catch(() => 0),
      Invoice.count({ where: { ...invoiceWhere, status: 'unpaid' } }).catch(() => 0),
    ]);

    // Purchase orders counts with error handling
    const [
      purchaseOrdersReceived,
      purchaseOrdersPending,
    ] = await Promise.all([
      PurchaseOrder.count({ where: { ...poWhereBase, status: 'delivered' } }).catch(() => 0),
      PurchaseOrder.count({ where: { ...poWhereBase, status: 'pending' } }).catch(() => 0),
    ]);

    // Amounts from purchase orders by linked quotation.total_price with error handling
    const [amountReceivedRow] = await PurchaseOrder.findAll({
      where: { ...poWhereBase, status: 'delivered' },
      include: [{ model: Quotation, as: 'quotation', attributes: [] }],
      attributes: [[sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('quotation.total_price')), 0), 'total']],
      raw: true,
    }).catch(() => [{ total: 0 }]);
    const [amountPendingRow] = await PurchaseOrder.findAll({
      where: { ...poWhereBase, status: 'pending' },
      include: [{ model: Quotation, as: 'quotation', attributes: [] }],
      attributes: [[sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('quotation.total_price')), 0), 'total']],
      raw: true,
    }).catch(() => [{ total: 0 }]);

    const totalAmountReceived = parseFloat(amountReceivedRow?.total || 0);
    const totalAmountPending = parseFloat(amountPendingRow?.total || 0);

    // Expenses summary - filter by month/year within date range
    const expenseWhere = {};
    if (startDate && endDate) {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      // Get all months/years within the date range
      const monthsInRange = [];
      const currentDate = new Date(startDateObj);
      
      while (currentDate <= endDateObj) {
        monthsInRange.push({
          month: currentDate.getMonth() + 1, // JavaScript months are 0-based
          year: currentDate.getFullYear()
        });
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      
      if (monthsInRange.length > 0) {
        expenseWhere[Op.or] = monthsInRange.map(m => ({
          month: m.month,
          year: m.year
        }));
      }
    }
    
    const [expensesTotal, expensesAmountRow] = await Promise.all([
      Expense.count({ where: expenseWhere }).catch(() => 0),
      Expense.findAll({
        where: expenseWhere,
        attributes: [[sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('amount')), 0), 'total']],
        raw: true,
      }).catch(() => [{ total: 0 }])
    ]);
    
    const totalExpensesAmount = parseFloat(expensesAmountRow[0]?.total || 0);

    // Salaries summary - filter by month/year within date range
    const salaryWhere = {};
    if (startDate && endDate) {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      // Get all months/years within the date range
      const monthsInRange = [];
      const currentDate = new Date(startDateObj);
      
      while (currentDate <= endDateObj) {
        monthsInRange.push({
          month: currentDate.getMonth() + 1, // JavaScript months are 0-based
          year: currentDate.getFullYear()
        });
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      
      if (monthsInRange.length > 0) {
        salaryWhere[Op.or] = monthsInRange.map(m => ({
          month: m.month,
          year: m.year
        }));
      }
    }
    
    const [salariesTotal, salariesAmountRow] = await Promise.all([
      EmployeeSalary.count({ where: salaryWhere }).catch(() => 0),
      EmployeeSalary.findAll({
        where: salaryWhere,
        attributes: [[sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('net_salary')), 0), 'total']],
        raw: true,
      }).catch(() => [{ total: 0 }])
    ]);
    
    const totalSalariesAmount = parseFloat(salariesAmountRow[0]?.total || 0);

    res.json({
      range: { startDate: startDate || null, endDate: endDate || null },
      invoices: {
        total: invoicesTotal,
        paid: invoicesPaid,
        unpaid: invoicesUnpaid,
      },
      purchaseOrders: {
        received: purchaseOrdersReceived,
        pending: purchaseOrdersPending,
      },
      amounts: {
        purchaseOrders: {
          received: totalAmountReceived,
          pending: totalAmountPending,
        },
      },
      expenses: {
        amount: totalExpensesAmount,
      },
      salaries: {
        amount: totalSalariesAmount,
      },
    });
  } catch (error) {
    console.error('Error generating dashboard summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getDashboardSummary };


