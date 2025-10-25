'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RolePermissionTab extends Model {
    static associate(models) {
      // Define associations here
      RolePermissionTab.belongsTo(models.Role, {
        foreignKey: 'role_id',
        as: 'role'
      });
      
      RolePermissionTab.belongsTo(models.Permission, {
        foreignKey: 'permission_id',
        as: 'permission'
      });
      
      RolePermissionTab.belongsTo(models.Tab, {
        foreignKey: 'tab_id',
        as: 'tab'
      });
    }
  }

  RolePermissionTab.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id'
      }
    },
    permission_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'permissions',
        key: 'id'
      }
    },
    tab_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tabs',
        key: 'id'
      }
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'RolePermissionTab',
    tableName: 'role_permission_tab',
    timestamps: false, // We're using custom created_at
    indexes: [
      {
        unique: true,
        fields: ['role_id', 'permission_id', 'tab_id'],
        name: 'unique_role_permission_tab'
      },
      {
        fields: ['role_id']
      },
      {
        fields: ['permission_id']
      },
      {
        fields: ['tab_id']
      }
    ]
  });

  return RolePermissionTab;
};
