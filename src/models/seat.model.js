
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Seat = sequelize.define(
  "Seat",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    hall_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    row_label: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    seat_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "seats",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Seat;
