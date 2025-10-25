'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const banks = [
      'Al Baraka Bank (Pakistan) Ltd.',
      'Allied Bank Ltd.',
      'Askari Bank Ltd.',
      'Bank AL Habib Ltd.',
      'Bank Alfalah Ltd.',
      'Bank Islami Pakistan Ltd.',
      'Bank of Punjab.',
      'Dubai Islamic Bank Pakistan Ltd.',
      'Faysal Bank Ltd.',
      'First Women Bank Ltd.',
      'Habib Bank Ltd. (HBL)',
      'Habib Metropolitan Bank Ltd.',
      'JS Bank Ltd.',
      'Meezan Bank Ltd.',
      'MCB Bank Ltd.',
      'MCB Islamic Bank Ltd.',
      'National Bank of Pakistan (NBP).',
      'Sindh Bank Ltd.',
      'Soneri Bank Ltd.',
      'Standard Chartered Bank.',
      'Summit Bank Ltd.',
      'United Bank Ltd. (UBL).',
      'Zarai Taraqiati Bank Ltd. (ZTBL).'
    ];

    const bankData = banks.map((bankName, index) => ({
      id: index + 1,
      bank_name: bankName,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }));

    await queryInterface.bulkInsert('banks', bankData, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('banks', null, {});
  }
};
