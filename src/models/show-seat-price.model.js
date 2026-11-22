
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ShowSeatPrice = sequelize.define(
  "ShowSeatPrice",
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

    seat_category_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
  },
  {
    tableName: "show_seat_prices",
    timestamps: true,
    underscored: true,
  }
);

module.exports = ShowSeatPrice;
