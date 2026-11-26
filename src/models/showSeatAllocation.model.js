
import sequelizeLibrary from "sequelize";
import sequelize from "../config/database.js";

const { DataTypes } = sequelizeLibrary;

/**
 * ShowSeatAllocation — the authoritative sold-seat record.
 * One row per confirmed sold seat per show.
 * The unique (show_id, seat_id) DB constraint prevents double-booking.
 */
const ShowSeatAllocation = sequelize.define(
  "ShowSeatAllocation",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    booking_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    tableName: "show_seat_allocations",
    timestamps: true,
    underscored: true,
  }
);

export default ShowSeatAllocation;
