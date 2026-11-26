
import sequelizeLibrary from "sequelize";
import sequelize from "../config/database.js";

const { DataTypes } = sequelizeLibrary;

const SeatHoldItem = sequelize.define(
  "SeatHoldItem",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    hold_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    show_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    seat_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "seat_hold_items",
    timestamps: true,
    underscored: true,
  }
);

export default SeatHoldItem;
