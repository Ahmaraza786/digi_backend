'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('invoices', 'with_hold_tax', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('invoices', 'cheque_amount', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true
    });

    await queryInterface.addColumn('invoices', 'voucher_no', {
      type: Sequelize.STRING(100),
      allowNull: true
    });

    await queryInterface.addColumn('invoices', 'bank', {
      type: Sequelize.STRING(100),
      allowNull: true
    });

    await queryInterface.addColumn('invoices', 'deposit_date', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('invoices', 'dw_bank', {
      type: Sequelize.STRING(100),
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('invoices', 'with_hold_tax');
    await queryInterface.removeColumn('invoices', 'cheque_amount');
    await queryInterface.removeColumn('invoices', 'voucher_no');
    await queryInterface.removeColumn('invoices', 'bank');
    await queryInterface.removeColumn('invoices', 'deposit_date');
    await queryInterface.removeColumn('invoices', 'dw_bank');
  }
};
