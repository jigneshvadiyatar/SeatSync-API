import Sequelize from "sequelize";
import sequelize from "../config/database.js";

const { DataTypes } = Sequelize;
const uuid = () => ({ type: DataTypes.UUID, allowNull: false });

export default sequelize.define("BookingItem", {
  id: { ...uuid(), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  booking_id: uuid(),
  show_id: uuid(),
  seat_id: uuid(),
  unit_price_minor: { type: DataTypes.BIGINT, allowNull: false },
}, {
  tableName: "booking_items",
  underscored: true,
});
