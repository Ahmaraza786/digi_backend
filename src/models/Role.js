'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    static associate(models) {
      // Define associations here
      Role.hasMany(models.User, {
        foreignKey: 'role_id',
        as: 'users'
      });
      
      Role.belongsToMany(models.Permission, {
        through: models.RolePermissionTab,
        foreignKey: 'role_id',
        otherKey: 'permission_id',
        as: 'permissions'
      });
      
      Role.belongsToMany(models.Tab, {
        through: models.RolePermissionTab,
        foreignKey: 'role_id',
        otherKey: 'tab_id',
        as: 'tabs'
      });
    }
  }

  Role.init({
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
    is_default: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
    timestamps: false, // We're using custom created_at
    indexes: []
  });

  return Role;
};
