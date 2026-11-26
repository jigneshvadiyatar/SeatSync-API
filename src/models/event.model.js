
import sequelizeLibrary from "sequelize";
import sequelize from "../config/database.js";

const { DataTypes } = sequelizeLibrary;

const Event = sequelize.define(
  "Event",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },

    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    slug: {
      type: DataTypes.STRING(220),
      allowNull: false,
      unique: true,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    category: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        isIn: [[
          "movie",
          "concert",
          "theatre",
          "sports",
          "other",
        ]],
      },
    },

    language: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 1 },
    },

    age_rating: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    poster_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    banner_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM(
        "draft",
        "published",
        "archived"
      ),
      allowNull: false,
      defaultValue: "draft",
    },

    published_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "events",
    timestamps: true,
    underscored: true,
  }
);

export default Event;
