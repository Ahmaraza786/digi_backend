'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EmployeeSalary extends Model {
    static associate(models) {
      // Association with Employee
      EmployeeSalary.belongsTo(models.Employee, {
        foreignKey: 'employee_id',
        as: 'employee'
      });
    }

    // Calculate net salary before saving
    beforeSave() {
      if (this.basic_salary !== undefined && this.bonus !== undefined && this.deductions !== undefined) {
        this.net_salary = parseFloat(this.basic_salary) + parseFloat(this.bonus) - parseFloat(this.deductions);
      }
    }
  }

  EmployeeSalary.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'employees',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 12
      }
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 2000,
        max: 2100
      }
    },
    basic_salary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    bonus: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    deductions: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    net_salary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    is_finalized: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'EmployeeSalary',
    tableName: 'employee_salaries',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['employee_id', 'month', 'year'],
        name: 'unique_employee_month_year'
      },
      {
        fields: ['month', 'year']
      },
      {
        fields: ['is_finalized']
      }
    ],
    hooks: {
      beforeSave: (instance) => {
        if (instance.basic_salary !== undefined && instance.bonus !== undefined && instance.deductions !== undefined) {
          instance.net_salary = parseFloat(instance.basic_salary) + parseFloat(instance.bonus) - parseFloat(instance.deductions);
        }
      }
    }
  });

  return EmployeeSalary;
};
