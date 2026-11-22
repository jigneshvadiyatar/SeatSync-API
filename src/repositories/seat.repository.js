
const { Op } = require("sequelize");
const {
  Hall,
  Venue,
  Seat,
  SeatCategory,
} = require("../models");

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

const createCategory = (data) =>
  SeatCategory.create(data);

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

const countSeats = (hallId, transaction) =>
  Seat.count({
    where: { hall_id: hallId },
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

const findCategoryInHall = (hallId, categoryId) =>
  SeatCategory.findOne({
    where: {
      id: categoryId,
      hall_id: hallId,
    },
  });

module.exports = {
  findHall,
  findHallForUpdate,
  findCategory,
  findCategories,
  findCategoryByCode,
  createCategory,
  updateCategory,
  findSeat,
  countSeats,
  findSeats,
  bulkCreateSeats,
  updateSeat,
  findCategoryInHall,
};
