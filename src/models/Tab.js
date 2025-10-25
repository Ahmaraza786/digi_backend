'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Tab extends Model {
    static associate(models) {
      // Define associations here
      Tab.belongsToMany(models.Role, {
        through: models.RolePermissionTab,
        foreignKey: 'tab_id',
        otherKey: 'role_id',
        as: 'roles'
      });
      
      Tab.belongsToMany(models.Permission, {
        through: models.RolePermissionTab,
        foreignKey: 'tab_id',
        otherKey: 'permission_id',
        as: 'permissions'
      });
    }
  }

  Tab.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    display_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Tab',
    tableName: 'tabs',
    timestamps: false, // We're using custom created_at
    indexes: []
  });

  return Tab;
};
