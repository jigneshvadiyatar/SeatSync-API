import { findPendingForShows } from "./booking.repository.js";
import { createError } from "../utils/error.util.js";

import sequelizeLibrary from "sequelize";
import { sequelize, SeatHold, SeatHoldItem, ShowSeatAllocation, Seat, SeatCategory, Show, Hall } from "../models/index.js";

const { Op } = sequelizeLibrary;

// ── Holds ─────────────────────────────────────────────────────────────────────

const findActiveHoldForSeats = (showId, seatIds, transaction) =>
  SeatHoldItem.findAll({
    where: {
      show_id: showId,
      seat_id: { [Op.in]: seatIds },
    },
    include: [
      {
        model: SeatHold,
        as: "hold",
        where: {
          status: "active",
          expires_at: { [Op.gt]: new Date() },
        },
        required: true,
      },
    ],
    transaction,
  });

const findAllocatedSeats = (showId, seatIds, transaction) =>
  ShowSeatAllocation.findAll({
    where: {
      show_id: showId,
      seat_id: { [Op.in]: seatIds },
    },
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });

const createHold = async (holdData, seatIds, transaction) => {
  const hold = await SeatHold.create(holdData, { transaction });

  await SeatHoldItem.bulkCreate(
    seatIds.map((seatId) => ({
      hold_id: hold.id,
      show_id: holdData.show_id,
      seat_id: seatId,
    })),
    { transaction }
  );

  return findHoldById(hold.id, transaction);
};

const holdIncludes = [
  {
    model: SeatHoldItem,
    as: "items",
    include: [
      {
        model: Seat,
        as: "seat",
        attributes: ["id", "row_label", "seat_number"],
        include: [
          {
            model: SeatCategory,
            as: "category",
            attributes: ["id", "name", "code"],
          },
        ],
      },
    ],
  },
];

const findHoldById = (holdId, transaction) =>
  SeatHold.findByPk(holdId, {
    include: holdIncludes,
    transaction,
  });

const findHoldByIdForUpdate = (holdId, transaction) =>
  SeatHold.findByPk(holdId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

const updateHoldStatus = (hold, status, transaction) =>
  hold.update({ status }, { transaction });

// ── Availability ──────────────────────────────────────────────────────────────

/**
 * Returns all seats for a show with their hold/sold status.
 * Uses a single query with LEFT JOINs to avoid N+1.
 */
const findAvailability = (showId) =>
  sequelize.query(
    `
    SELECT
      s.id              AS seat_id,
      s.row_label,
      s.seat_number,
      s.is_active,
      sc.id             AS category_id,
      sc.name           AS category_name,
      sc.code           AS category_code,
      ssp.price,
      CASE
        WHEN ssa.id IS NOT NULL              THEN 'sold'
        WHEN sh.id IS NOT NULL              THEN 'held'
        ELSE 'available'
      END               AS seat_status,
      -- only expose expiry time for the requesting user (filtered in service)
      sh.user_id        AS held_by_user_id,
      sh.expires_at     AS hold_expires_at
    FROM seats s
    JOIN halls h ON h.id = s.hall_id
    JOIN shows sh2 ON sh2.hall_id = h.id AND sh2.id = :showId
    JOIN seat_categories sc ON sc.id = s.category_id
    LEFT JOIN show_seat_prices ssp
           ON ssp.show_id = :showId AND ssp.seat_category_id = sc.id
    LEFT JOIN show_seat_allocations ssa
           ON ssa.show_id = :showId AND ssa.seat_id = s.id
    LEFT JOIN LATERAL (
      SELECT h.id, h.user_id, COALESCE(b.expires_at, h.expires_at) AS expires_at
      FROM seat_hold_items i
      JOIN seat_holds h ON h.id = i.hold_id AND h.show_id = i.show_id
      LEFT JOIN bookings b ON b.hold_id = h.id AND b.show_id = i.show_id
      WHERE i.show_id = :showId AND i.seat_id = s.id
        AND (
          (h.status = 'active' AND h.expires_at > statement_timestamp())
          OR (h.status = 'converted' AND b.status = 'pending_payment'
            AND b.expires_at > statement_timestamp())
        )
      ORDER BY expires_at DESC, h.id
      LIMIT 1
    ) sh ON true
    WHERE s.is_active = true
    ORDER BY s.row_label ASC, s.seat_number ASC
    `,
    {
      replacements: { showId },
      type: sequelize.QueryTypes.SELECT,
    }
  );

// ── Expire stale holds (background sweep) ────────────────────────────────────

const findActiveSeats = (hallId, seatIds, transaction) =>
  Seat.findAll({
    where: { hall_id: hallId, id: seatIds, is_active: true },
    transaction,
  });

const assertShowsUnreserved = async (showIds, transaction) => {
  const activeHold = await SeatHold.findOne({
    where: { show_id: showIds, status: "active", expires_at: { [Op.gt]: new Date() } },
    attributes: ["id"],
    transaction,
  });
  const allocation = await ShowSeatAllocation.findOne({
    where: { show_id: showIds },
    attributes: ["id"],
    transaction,
  });
  if (activeHold || allocation || await findPendingForShows(showIds, transaction)) {
    throw createError("A show has active reservations or sold seats", 409);
  }
};

const findScheduledShows = (where, transaction, include) =>
  Show.findAll({
    where: {
      ...where,
      status: "scheduled",
      ends_at: { [Op.gt]: new Date() },
    },
    attributes: ["id"],
    transaction,
    include,
  });

const assertScheduledShowsUnreserved = async (where, transaction, include) => {
  const shows = await findScheduledShows(where, transaction, include);
  if (shows.length) await assertShowsUnreserved(shows.map(({ id }) => id), transaction);
};

const assertHallUnreserved = (hallId, transaction) =>
  assertScheduledShowsUnreserved({ hall_id: hallId }, transaction);

const assertEventUnreserved = (eventId, transaction) =>
  assertScheduledShowsUnreserved({ event_id: eventId }, transaction);

const assertVenueUnreserved = (venueId, transaction) =>
  assertScheduledShowsUnreserved({}, transaction, [{
    model: Hall,
    as: "hall",
    attributes: [],
    where: { venue_id: venueId },
  }]);

const expireStaleHolds = (transaction) =>
  SeatHold.update(
    { status: "expired" },
    {
      where: {
        status: "active",
        expires_at: { [Op.lte]: new Date() },
      },
      transaction,
    }
  );

export {
  findActiveHoldForSeats,
  findAllocatedSeats,
  createHold,
  findHoldById,
  findHoldByIdForUpdate,
  updateHoldStatus,
  findAvailability,
  expireStaleHolds,
  findActiveSeats,
  assertShowsUnreserved,
  findScheduledShows,
  assertHallUnreserved,
  assertEventUnreserved,
  assertVenueUnreserved,
};
