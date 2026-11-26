
import sequelizeLibrary from "sequelize";
import { Hall, Venue } from "../models/index.js";

const { Op } = sequelizeLibrary;

const findVenueById = async (venueId) => {
  return Venue.findByPk(venueId);
};

const createHall = async (data) => {
  return Hall.create(data);
};

const findHallById = async (id, transaction) => {
  return Hall.findByPk(id, {
    transaction,
    ...(transaction ? { lock: { level: transaction.LOCK.UPDATE, of: Hall } } : {}),
    include: [
      {
        model: Venue,
        as: "venue",
        attributes: [
          "id",
          "name",
          "city",
          "is_active",
        ],
      },
    ],
  });
};

const findHallsByVenue = async ({
  venueId,
  page,
  limit,
  search,
  isActive,
}) => {
  const where = {
    venue_id: venueId,
  };

  if (isActive !== undefined) {
    where.is_active = isActive;
  }

  if (search) {
    where[Op.or] = [
      {
        name: {
          [Op.iLike]: `%${search}%`,
        },
      },
      {
        code: {
          [Op.iLike]: `%${search}%`,
        },
      },
    ];
  }

  return Hall.findAndCountAll({
    where,
    limit,
    offset: (page - 1) * limit,
    order: [
      ["name", "ASC"],
      ["id", "ASC"],
    ],
  });
};

const findHallByCode = async (venueId, code) => {
  return Hall.findOne({
    where: {
      venue_id: venueId,
      code,
    },
  });
};

const updateHall = async (hall, updates, transaction) => {
  return hall.update(updates, { transaction });
};

const deactivateHall = async (hall, transaction) => {
  return hall.update({
    is_active: false,
  }, { transaction });
};

export {
  findVenueById,
  createHall,
  findHallById,
  findHallsByVenue,
  findHallByCode,
  updateHall,
  deactivateHall,
};
