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
    },
    effective_from: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      validate: {
        isDate: {
          args: true,
          msg: 'Effective from must be a valid date'
        }
      }
    },
    effective_to: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isDate: {
          args: true,
          msg: 'Effective to must be a valid date'
        },
        isValidDateRange(value) {
          if (value && this.effective_from && value <= this.effective_from) {
            throw new Error('Effective to date must be after effective from date');
          }
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
