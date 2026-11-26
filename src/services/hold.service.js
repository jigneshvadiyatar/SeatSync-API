import * as shows from "../repositories/show.repository.js";
import { findPendingSeats } from "../repositories/booking.repository.js";
import * as holds from "../repositories/hold.repository.js";
import * as showService from "./show.service.js";
import { createError } from "../utils/error.util.js";
import { getReadyRedisClient } from "../config/redis.js";

const holdTtl = () => Number(process.env.SEAT_HOLD_TTL_SECONDS ?? 300);

const holdKey = (id) => `seatsync:hold:${id}`;

const writeHoldMetadata = (hold) => {
  const redis = getReadyRedisClient();
  const seconds = Math.ceil((new Date(hold.expires_at) - Date.now()) / 1000);
  if (redis && seconds > 0) {
    void redis.set(holdKey(hold.id), hold.show_id, { expiration: { type: "EX", value: seconds } })
      .catch((error) => console.warn("Could not cache a seat hold", error.message));
  }
};

const createHold = async (showId, userId, seatIds) => {
  const ids = seatIds.map((id) => id.toLowerCase());
  if (new Set(ids).size !== ids.length) {
    throw createError("Seat IDs must be unique", 422);
  }

  const hold = await shows.sequelize.transaction(async (transaction) => {
    // The existing show row serializes claims even before any hold rows exist.
    const show = await shows.findShowRecordById(showId, transaction, true);
    if (!show) throw createError("Show not found", 404);

    const event = await shows.findEventById(show.event_id, transaction, true);
    const hall = await shows.findHallById(show.hall_id, transaction, true);
    const venue = await shows.findVenueById(hall.venue_id, transaction, true);
    const now = Date.now();

    if (event.status !== "published" || !hall.is_active || !venue.is_active) {
      throw createError("Show not found", 404);
    }

    if (
      show.status !== "scheduled" ||
      new Date(show.starts_at).getTime() <= now ||
      (show.booking_opens_at && new Date(show.booking_opens_at).getTime() > now) ||
      (show.booking_closes_at && new Date(show.booking_closes_at).getTime() <= now)
    ) {
      throw createError("The booking window is closed", 409);
    }

    const seats = await holds.findActiveSeats(hall.id, ids, transaction);
    if (seats.length !== ids.length) {
      throw createError("All seats must be active and belong to this hall", 422);
    }

    const prices = await shows.findShowPrices(showId, transaction);
    const pricedCategories = new Set(prices.map((price) => price.seat_category_id));
    if (seats.some((seat) => !pricedCategories.has(seat.category_id))) {
      throw createError("A selected seat has no price for this show", 409);
    }

    const existing = await holds.findActiveHoldForSeats(showId, ids, transaction);
    const sold = await holds.findAllocatedSeats(showId, ids, transaction);
    if (existing.length || sold.length || await findPendingSeats(showId, ids, transaction)) {
      throw createError("One or more seats are already held or sold", 409);
    }

    const checkoutCloses = new Date(show.booking_closes_at ?? show.starts_at).getTime();
    const createdAt = Date.now();
    if (checkoutCloses <= createdAt) throw createError("The booking window is closed", 409);
    return holds.createHold({
      show_id: show.id,
      user_id: userId,
      expires_at: new Date(Math.min(createdAt + holdTtl() * 1000, checkoutCloses)),
    }, ids, transaction);
  });

  writeHoldMetadata(hold);
  return hold;
};

const getHold = async (id, userId) => {
  const hold = await holds.findHoldById(id);
  if (!hold || hold.user_id !== userId) throw createError("Hold not found", 404);
  const result = hold.toJSON();
  if (result.status === "active" && new Date(result.expires_at) <= new Date()) {
    result.status = "expired";
  }
  return result;
};

const releaseHold = async (id, userId) => {
  await shows.sequelize.transaction(async (transaction) => {
    const hold = await holds.findHoldByIdForUpdate(id, transaction);
    if (!hold || hold.user_id !== userId) throw createError("Hold not found", 404);
    if (hold.status === "converted") throw createError("Hold has already been converted", 409);
    if (hold.status === "active") {
      const status = new Date(hold.expires_at) <= new Date() ? "expired" : "cancelled";
      await holds.updateHoldStatus(hold, status, transaction);
    }
  });

  removeHoldMetadata(id);
};

const removeHoldMetadata = (id) => {
  const redis = getReadyRedisClient();
  if (redis) {
    void redis.del(holdKey(id)).catch((error) => console.warn("Could not remove hold metadata", error.message));
  }
};

const getAvailability = async (showId, user, includeAvailability = true) => {
  const show = await showService.getShowById(showId, user?.role === "admin");
  const seats = await holds.findAvailability(show.id);
  return {
    showId: show.id,
    seats: seats.map(({ held_by_user_id, hold_expires_at, seat_status, ...seat }) => {
      if (!includeAvailability) return seat;
      const heldByYou = seat_status === "held" && held_by_user_id === user?.id;
      return {
        ...seat,
        status: seat_status,
        ...(heldByYou ? { heldByYou, holdExpiresAt: hold_expires_at } : {}),
      };
    }),
  };
};

export { holdTtl, createHold, getHold, releaseHold, getAvailability, removeHoldMetadata };
