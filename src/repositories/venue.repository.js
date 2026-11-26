
import sequelizeLibrary from "sequelize";
import { Venue } from "../models/index.js";

const { Op } = sequelizeLibrary;

const createVenue = async (venueData) => {
  return Venue.create(venueData);
};

const findVenues = async ({
  page = 1,
  limit = 10,
  city,
  search,
  is_active,
}) => {
  const where = {};

  if (is_active !== undefined) {
    where.is_active = is_active;
  }

  if (city) {
    where.city = {
      [Op.iLike]: city,
    };
  }

  if (search) {
    // FIX: Escape ILIKE wildcard characters from user input.
    const escaped = search.replace(/[\\%_]/g, "\\$&");

    where.name = {
      [Op.iLike]: `%${escaped}%`,
    };
  }

  const offset = (page - 1) * limit;

  return Venue.findAndCountAll({
    where,
    limit,
    offset,
    order: [
      ["createdAt", "DESC"],
      ["id", "ASC"],
    ],
  });
};

const findVenueById = async (id, transaction) => {
  return Venue.findByPk(id, { transaction, lock: transaction?.LOCK.UPDATE });
};

const updateVenue = async (venue, updates) => {
  return venue.update(updates);
};

const deactivateVenue = async (venue, transaction) => {
  return venue.update({
    is_active: false,
  }, { transaction });
};

export {
  createVenue,
  findVenues,
  findVenueById,
  updateVenue,
  deactivateVenue,
};
