
import sequelizeLibrary from "sequelize";
import sequelize from "../config/database.js";

const { DataTypes } = sequelizeLibrary;

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
      set(value) {
        this.setDataValue("email", value.trim().toLowerCase());
      },
    },

    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    google_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },

    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    avatar_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    role: {
      type: DataTypes.ENUM("user", "admin"),
      allowNull: false,
      defaultValue: "user",
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    email_verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "users",
    timestamps: true,
    underscored: true,
  }
);

export default User;
