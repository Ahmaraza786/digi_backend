'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Tax extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Tax.init({
    service_type: {
      type: DataTypes.ENUM('material', 'service'),
      allowNull: false,
      unique: true,
      validate: {
        isIn: {
          args: [['material', 'service']],
          msg: 'Service type must be either material or service'
        }
      }
    },
    tax_percent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 1,
        max: 98,
        isDecimal: {
          args: true,
          msg: 'Tax percentage must be a decimal number'
        }
      }
    }
  }, {
    sequelize,
    modelName: 'Tax',
    tableName: 'taxes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return Tax;
};
