
import sequelizeLibrary from "sequelize";
import sequelize from "../config/database.js";

const { DataTypes } = sequelizeLibrary;

const SeatCategory = sequelize.define(
  "SeatCategory",
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
    name: {
      type: DataTypes.STRING(60),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    base_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 },
    },
  },
  {
    tableName: "seat_categories",
    timestamps: true,
    underscored: true,
  }
);

export default SeatCategory;
