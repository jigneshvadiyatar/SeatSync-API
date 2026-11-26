import Sequelize from "sequelize";
import * as bookings from "../repositories/booking.repository.js";
import * as holds from "../repositories/hold.repository.js";
import * as shows from "../repositories/show.repository.js";
import { createError } from "../utils/error.util.js";
import { removeHoldMetadata } from "./hold.service.js";

const { UniqueConstraintError } = Sequelize;

const formatBooking = (booking) => {
  const { idempotency_key, ...data } = booking.toJSON();
  if (data.status === "pending_payment" && new Date(data.expires_at) <= new Date()) {
    data.status = "expired";
  }
  return data;
};

const replay = (booking, holdId) => {
  if (booking.hold_id !== holdId) {
    throw createError("Idempotency-Key was already used for a different hold", 409);
  }
  return { booking: formatBooking(booking), created: false };
};

const toMinorUnits = (price) => {
  const [whole, fraction = ""] = String(price).split(".");
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
};

export const createBooking = async (userId, holdId, key) => {
  holdId = holdId.toLowerCase();
  const existing = await bookings.findByKey(userId, key);
  if (existing) return replay(existing, holdId);

  try {
    const result = await shows.sequelize.transaction(async (transaction) => {
      const initialHold = await holds.findHoldById(holdId, transaction);
      if (!initialHold || initialHold.user_id !== userId) {
        throw createError("Hold not found", 404);
      }

      // Use the same show lock as new hold creation and show mutations.
      const show = await shows.findShowRecordById(initialHold.show_id, transaction, true);
      if (!show) throw createError("Show not found", 404);

      const duplicate = await bookings.findByKey(userId, key, transaction);
      if (duplicate) return replay(duplicate, holdId);

      const event = await shows.findEventById(show.event_id, transaction, true);
      const hall = await shows.findHallById(show.hall_id, transaction, true);
      const venue = await shows.findVenueById(hall.venue_id, transaction, true);
      const hold = await holds.findHoldByIdForUpdate(holdId, transaction);
      if (!hold || hold.user_id !== userId) throw createError("Hold not found", 404);
      if (hold.status !== "active" || new Date(hold.expires_at) <= new Date()) {
        throw createError("Only an active, unexpired hold can be converted", 409);
      }

      const close = new Date(show.booking_closes_at ?? show.starts_at).getTime();
      if (show.status !== "scheduled" || event.status !== "published" || !hall.is_active || !venue.is_active) {
        throw createError("Show is no longer bookable", 409);
      }

      const { items } = await holds.findHoldById(holdId, transaction);
      const seatIds = items.map(({ seat_id }) => seat_id);
      const seats = await holds.findActiveSeats(hall.id, seatIds, transaction);
      if (!seatIds.length || seats.length !== seatIds.length) {
        throw createError("The held seats are no longer bookable", 409);
      }
      if ((await holds.findAllocatedSeats(show.id, seatIds, transaction)).length ||
          await bookings.findPendingSeats(show.id, seatIds, transaction)) {
        throw createError("A held seat is already reserved or sold", 409);
      }

      const prices = await shows.findShowPrices(show.id, transaction);
      const byCategory = new Map(prices.map(({ seat_category_id, price }) => [seat_category_id, price]));
      let total = 0n;
      const lines = seats.map((seat) => {
        const price = byCategory.get(seat.category_id);
        if (price == null) throw createError("A held seat has no show price", 409);
        const minor = toMinorUnits(price);
        total += minor;
        return { seat_id: seat.id, unit_price_minor: minor.toString() };
      });

      const now = Date.now();
      if (new Date(hold.expires_at).getTime() <= now || close <= now ||
          (show.booking_opens_at && new Date(show.booking_opens_at).getTime() > now)) {
        throw createError("The hold or booking window has expired", 409);
      }
      const ttl = Number(process.env.BOOKING_TTL_SECONDS ?? 600);
      const booking = await bookings.create({
        user_id: userId,
        show_id: show.id,
        hold_id: hold.id,
        idempotency_key: key,
        total_minor: total.toString(),
        currency: "INR",
        expires_at: new Date(Math.min(now + ttl * 1000, close)),
      }, lines, transaction);
      await holds.updateHoldStatus(hold, "converted", transaction);
      return { booking: formatBooking(booking), created: true };
    });

    if (result.created) removeHoldMetadata(holdId);
    return result;
  } catch (error) {
    if (!(error instanceof UniqueConstraintError)) throw error;
    const duplicate = await bookings.findByKey(userId, key);
    if (duplicate) return replay(duplicate, holdId);
    throw createError("This hold already has a booking", 409);
  }
};

export const getBooking = async (id, userId) => {
  const booking = await bookings.findOwned(id, userId);
  if (!booking) throw createError("Booking not found", 404);
  return formatBooking(booking);
};

export const listBookings = async (userId, page = 1, limit = 20) => {
  const { rows, count } = await bookings.findHistory(userId, limit, (page - 1) * limit);
  return {
    bookings: rows.map(formatBooking),
    pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
  };
};

export const cancelBooking = async (id, userId) => {
  await bookings.changePendingStatus(id, userId, "cancelled");
  const booking = await getBooking(id, userId);
  if (booking.status !== "cancelled") {
    throw createError("Only a pending booking can be cancelled", 409);
  }
  return booking;
};
