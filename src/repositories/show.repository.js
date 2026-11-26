
import sequelizeLibrary from "sequelize";

import { sequelize, Event, Venue, Hall, SeatCategory, Show, ShowSeatPrice } from "../models/index.js";

const { Op } = sequelizeLibrary;

const findEventById = (id, transaction, lock = false) =>
  Event.findByPk(id, {
    transaction,
    ...(lock && transaction
      ? { lock: transaction.LOCK.UPDATE }
      : {}),
  });

const findVenueById = (id, transaction, lock = false) =>
  Venue.findByPk(id, {
    transaction,
    ...(lock && transaction
      ? { lock: transaction.LOCK.UPDATE }
      : {}),
  });

const findHallById = (id, transaction, lock = false) =>
  Hall.findByPk(id, {
    transaction,
    ...(lock && transaction
      ? { lock: transaction.LOCK.UPDATE }
      : {}),
  });

const findSeatCategoriesByIds = (
  ids,
  hallId,
  transaction
) =>
  SeatCategory.findAll({
    where: {
      id: { [Op.in]: ids },
      hall_id: hallId,
    },
    attributes: ["id", "hall_id", "name", "code", "base_price"],
    transaction,
  });


const findAllSeatCategoriesByHallId = (hallId, transaction) =>
  SeatCategory.findAll({
    where: { hall_id: hallId },
    attributes: ["id", "hall_id", "name", "code", "base_price"],    
    transaction,
  });


const findShowRecordById = (
  id,
  transaction,
  lock = false
) =>
  Show.findByPk(id, {
    transaction,
    ...(lock && transaction
      ? { lock: transaction.LOCK.UPDATE }
      : {}),
  });

const showIncludes = [
  {
    model: Event,
    as: "event",
    attributes: [
      "id",
      "title",
      "slug",
      "category",
      "status",
      "duration_minutes",
    ],
    required: true,
  },
  {
    model: Hall,
    as: "hall",
    attributes: [
      "id",
      "venue_id",
      "name",
      "code",
      "capacity",
      "is_active",
    ],
    required: true,
    include: [{ model: Venue, as: "venue", attributes: ["id", "is_active"], required: true }],
  },
  {
    model: ShowSeatPrice,
    as: "seatPrices",
    attributes: [
      "id",
      "show_id",
      "seat_category_id",
      "price",
    ],
    required: false,
    include: [
      {
        model: SeatCategory,
        as: "seatCategory",
        attributes: [
          "id",
          "name",
          "code",
          "base_price",
        ],
        required: true,
      },
    ],
  },
];

const findShowById = (id, transaction) =>
  Show.findByPk(id, {
    include: showIncludes,
    transaction,
  });

const findShowPrices = (showId, transaction) =>
  ShowSeatPrice.findAll({ where: { show_id: showId }, attributes: ["seat_category_id", "price"], transaction });

const createShow = async (
  data,
  priceRows,
  transaction
) => {
  const show = await Show.create(data, { transaction });

  await ShowSeatPrice.bulkCreate(
    priceRows.map((item) => ({
      show_id: show.id,
      seat_category_id: item.seat_category_id,
      price: item.price,
    })),
    { transaction }
  );

  return findShowById(show.id, transaction);
};

const findShows = ({
  page,
  limit,
  status,
  eventId,
  hallId,
  from,
  to,
  publishedOnly,
}) => {
  const where = {};
  const eventWhere = {};

  if (status) {
    where.status = status;
  }

  if (eventId) {
    where.event_id = eventId;
  }

  if (hallId) {
    where.hall_id = hallId;
  }

  if (from || to) {
    where.starts_at = {};

    if (from) {
      where.starts_at[Op.gte] = from;
    }

    if (to) {
      where.starts_at[Op.lt] = to;
    }
  }

  if (publishedOnly) {
    eventWhere.status = "published";
  }

  return Show.findAndCountAll({
    where,
    include: [
      {
        model: Event,
        as: "event",
        attributes: [
          "id",
          "title",
          "slug",
          "category",
          "status",
          "duration_minutes",
        ],
        where: eventWhere,
        required: true,
      },
      {
        model: Hall,
        as: "hall",
        attributes: [
          "id",
          "venue_id",
          "name",
          "code",
          "capacity",
          "is_active",
        ],
        required: true,
        ...(publishedOnly ? { where: { is_active: true } } : {}),
        include: [{
          model: Venue,
          as: "venue",
          attributes: ["id", "is_active"],
          required: true,
          ...(publishedOnly ? { where: { is_active: true } } : {}),
        }],
      },
      {
        model: ShowSeatPrice,
        as: "seatPrices",
        attributes: [
          "id",
          "seat_category_id",
          "price",
        ],
        required: false,
        include: [
          {
            model: SeatCategory,
            as: "seatCategory",
            attributes: ["id", "name", "code"],
            required: true,
          },
        ],
      },
    ],
    distinct: true,
    col: "id",
    limit,
    offset: (page - 1) * limit,
    order: [
      ["starts_at", "ASC"],
      ["id", "ASC"],
    ],
  });
};

const updateShow = (show, updates, transaction) =>
  show.update(updates, { transaction });

const replaceShowPrices = async (
  showId,
  priceRows,
  transaction
) => {
  await ShowSeatPrice.destroy({
    where: { show_id: showId },
    transaction,
  });

  await ShowSeatPrice.bulkCreate(
    priceRows.map((item) => ({
      show_id: showId,
      seat_category_id: item.seat_category_id,
      price: item.price,
    })),
    { transaction }
  );

  return findShowById(showId, transaction);
};

export {
  sequelize,
  findEventById,
  findVenueById,
  findHallById,
  findSeatCategoriesByIds,
  findAllSeatCategoriesByHallId,
  findShowRecordById,
  findShowPrices,
  findShowById,
  createShow,
  findShows,
  updateShow,
  replaceShowPrices,
};
