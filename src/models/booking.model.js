import Sequelize from "sequelize";
import sequelize from "../config/database.js";

const { DataTypes } = Sequelize;
const uuid = () => ({ type: DataTypes.UUID, allowNull: false });

export default sequelize.define("Booking", {
  id: { ...uuid(), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  user_id: uuid(),
  show_id: uuid(),
  hold_id: uuid(),
  idempotency_key: { type: DataTypes.STRING(128), allowNull: false },
  status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "pending_payment" },
  total_minor: { type: DataTypes.BIGINT, allowNull: false },
  currency: { type: DataTypes.CHAR(3), allowNull: false },
  expires_at: { type: DataTypes.DATE, allowNull: false },
}, {
  tableName: "bookings",
  underscored: true,
});
