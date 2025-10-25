'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Permission extends Model {
    static associate(models) {
      // Define associations here
      Permission.belongsToMany(models.Role, {
        through: models.RolePermissionTab,
        foreignKey: 'permission_id',
        otherKey: 'role_id',
        as: 'roles'
      });
      
      Permission.belongsToMany(models.Tab, {
        through: models.RolePermissionTab,
        foreignKey: 'permission_id',
        otherKey: 'tab_id',
        as: 'tabs'
      });
    }
  }

  Permission.init({
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
    modelName: 'Permission',
    tableName: 'permissions',
    timestamps: false, // We're using custom created_at
    indexes: []
  });

  return Permission;
};
