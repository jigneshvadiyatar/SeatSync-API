
import sequelizeLibrary from "sequelize";
import sequelize from "../config/database.js";

const { DataTypes } = sequelizeLibrary;

const Show = sequelize.define(
  "Show",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },

    event_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    hall_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    starts_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    ends_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    booking_opens_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    booking_closes_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM(
        "scheduled",
        "cancelled",
        "completed"
      ),
      allowNull: false,
      defaultValue: "scheduled",
    },
  },
  {
    tableName: "shows",
    timestamps: true,
    underscored: true,
  }
);

export default Show;
