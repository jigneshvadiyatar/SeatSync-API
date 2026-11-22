
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const UserSession = sequelize.define(
  "UserSession",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },

    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },

    refresh_token_hash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },

    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    ip_address: {
      type: DataTypes.INET,
      allowNull: true,
    },

    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "user_sessions",
    timestamps: true,
    underscored: true,
  }
);

module.exports = UserSession;
