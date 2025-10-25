'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CustomerMaterialPrice extends Model {
    static associate(models) {
      CustomerMaterialPrice.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'customer'
      });
      CustomerMaterialPrice.belongsTo(models.Material, {
        foreignKey: 'material_id',
        as: 'material'
      });
    }
  }

  CustomerMaterialPrice.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    material_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    last_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'CustomerMaterialPrice',
    tableName: 'customer_material_prices',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['customer_id', 'material_id']
      }
    ]
  });

  return CustomerMaterialPrice;
};
