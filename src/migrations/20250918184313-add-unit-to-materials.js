'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Update existing quotations to add default unit 'EA' to materials that don't have it
    const quotations = await queryInterface.sequelize.query(
      'SELECT id, materials FROM quotations WHERE materials IS NOT NULL',
      { type: Sequelize.QueryTypes.SELECT }
    );

    for (const quotation of quotations) {
      if (quotation.materials && Array.isArray(quotation.materials)) {
        let updated = false;
        const updatedMaterials = quotation.materials.map(material => {
          if (!material.unit) {
            updated = true;
            return { ...material, unit: 'EA' }; // Default unit
          }
          return material;
        });

        if (updated) {
          await queryInterface.sequelize.query(
            'UPDATE quotations SET materials = :materials WHERE id = :id',
            {
              replacements: {
                materials: JSON.stringify(updatedMaterials),
                id: quotation.id
              },
              type: Sequelize.QueryTypes.UPDATE
            }
          );
        }
      }
    }
  },

  async down (queryInterface, Sequelize) {
    // Remove unit field from materials in existing quotations
    const quotations = await queryInterface.sequelize.query(
      'SELECT id, materials FROM quotations WHERE materials IS NOT NULL',
      { type: Sequelize.QueryTypes.SELECT }
    );

    for (const quotation of quotations) {
      if (quotation.materials && Array.isArray(quotation.materials)) {
        let updated = false;
        const updatedMaterials = quotation.materials.map(material => {
          if (material.unit) {
            updated = true;
            const { unit, ...materialWithoutUnit } = material;
            return materialWithoutUnit;
          }
          return material;
        });

        if (updated) {
          await queryInterface.sequelize.query(
            'UPDATE quotations SET materials = :materials WHERE id = :id',
            {
              replacements: {
                materials: JSON.stringify(updatedMaterials),
                id: quotation.id
              },
              type: Sequelize.QueryTypes.UPDATE
            }
          );
        }
      }
    }
  }
};
