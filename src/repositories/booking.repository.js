import Sequelize from "sequelize";
import { Booking, BookingItem } from "../models/index.js";

const { Op, literal } = Sequelize;
const items = { model: BookingItem, as: "items" };
const pending = () => ({
  status: "pending_payment",
  expires_at: { [Op.gt]: literal("statement_timestamp()") },
});

export const findByKey = (userId, key, transaction) =>
  Booking.findOne({
    where: { user_id: userId, idempotency_key: key },
    include: [items],
    transaction,
  });

export const findOwned = (id, userId) =>
  Booking.findOne({ where: { id, user_id: userId }, include: [items] });

export const findHistory = (userId, limit, offset) =>
  Booking.findAndCountAll({
    where: { user_id: userId },
    include: [items],
    distinct: true,
    order: [["createdAt", "DESC"], ["id", "DESC"]],
    limit,
    offset,
  });

export const create = async (data, lines, transaction) => {
  const booking = await Booking.create(data, { transaction });
  const created = await BookingItem.bulkCreate(
    lines.map((line) => ({ ...line, booking_id: booking.id, show_id: booking.show_id })),
    { transaction }
  );
  booking.setDataValue("items", created);
  return booking;
};

export const findPendingSeats = (showId, seatIds, transaction) =>
  BookingItem.findOne({
    where: { show_id: showId, seat_id: seatIds },
    include: [{ model: Booking, as: "booking", where: pending(), attributes: [] }],
    transaction,
  });

export const findPendingForShows = (showIds, transaction) =>
  Booking.findOne({
    where: { show_id: showIds, ...pending() },
    attributes: ["id"],
    transaction,
  });

export const changePendingStatus = (id, userId, status) =>
  Booking.update({ status }, { where: { id, user_id: userId, ...pending() } });

export const expireStaleBookings = () =>
  Booking.update({ status: "expired" }, {
    where: {
      status: "pending_payment",
      expires_at: { [Op.lte]: literal("statement_timestamp()") },
    },
  });
