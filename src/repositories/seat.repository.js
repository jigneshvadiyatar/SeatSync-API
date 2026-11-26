
import sequelizeLibrary from "sequelize";
import { Hall, Venue, Seat, SeatCategory } from "../models/index.js";

const { Op } = sequelizeLibrary;

const findHall = (hallId, options = {}) =>
  Hall.findByPk(hallId, {
    include: [
      {
        model: Venue,
        as: "venue",
        attributes: ["id", "name", "is_active"],
      },
    ],
    ...options,
  });

const findHallForUpdate = (hallId, transaction) =>
  Hall.findByPk(hallId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

const findVenueForUpdate = (venueId, transaction) =>
  Venue.findByPk(venueId, { transaction, lock: transaction.LOCK.UPDATE });

const findSeatForUpdate = (seatId, transaction) =>
  Seat.findByPk(seatId, { transaction, lock: transaction.LOCK.UPDATE });

const findCategory = (categoryId, options = {}) =>
  SeatCategory.findByPk(categoryId, options);

const findCategories = (hallId) =>
  SeatCategory.findAll({
    where: { hall_id: hallId },
    order: [["name", "ASC"]],
  });

const findCategoryByCode = (hallId, code) =>
  SeatCategory.findOne({
    where: { hall_id: hallId, code },
  });

const createCategory = (data, transaction) =>
  SeatCategory.create(data, { transaction });

const updateCategory = (category, data) =>
  category.update(data);

const findSeat = (seatId) =>
  Seat.findByPk(seatId, {
    include: [
      {
        model: SeatCategory,
        as: "category",
      },
    ],
  });

/**
 * Count ALL seats (active + inactive) for a hall.
 * Used internally if you need to know total physical seats.
 */
const countSeats = (hallId, transaction) =>
  Seat.count({
    where: { hall_id: hallId },
    transaction,
  });

/**
 * FIX: Count only ACTIVE seats for capacity enforcement.
 * Deactivated seats no longer occupy usable positions.
 */
const countActiveSeats = (hallId, transaction) =>
  Seat.count({
    where: { hall_id: hallId, is_active: true },
    transaction,
  });

const findSeats = (hallId, isAdmin = false) =>
  Seat.findAll({
    where: {
      hall_id: hallId,
      ...(isAdmin ? {} : { is_active: true }),
    },
    include: [
      {
        model: SeatCategory,
        as: "category",
        attributes: ["id", "name", "code", "base_price"],
      },
    ],
    order: [
      ["row_label", "ASC"],
      ["seat_number", "ASC"],
    ],
  });

const bulkCreateSeats = (seats, transaction) =>
  Seat.bulkCreate(seats, {
    transaction,
    validate: true,
  });

const updateSeat = (seat, data, transaction) =>
  seat.update(data, { transaction });

const findCategoryInHall = (hallId, categoryId, transaction) =>
  SeatCategory.findOne({
    where: {
      id: categoryId,
      hall_id: hallId,
    },
    transaction,
  });

export {
  findHall,
  findHallForUpdate,
  findVenueForUpdate,
  findSeatForUpdate,
  findCategory,
  findCategories,
  findCategoryByCode,
  createCategory,
  updateCategory,
  findSeat,
  countSeats,
  countActiveSeats,
  findSeats,
  bulkCreateSeats,
  updateSeat,
  findCategoryInHall,
};
