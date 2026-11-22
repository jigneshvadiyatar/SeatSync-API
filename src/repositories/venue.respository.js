
const { Op } = require("sequelize");
const { Venue } = require("../models");

const createVenue = async (venueData) => {
  return Venue.create(venueData);
};

const findVenues = async ({
  page = 1,
  limit = 10,
  city,
  search,
  is_active = true,
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
    where.name = {
      [Op.iLike]: `%${search}%`,
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

const findVenueById = async (id) => {
  return Venue.findByPk(id);
};

const updateVenue = async (venue, updates) => {
  return venue.update(updates);
};

const deactivateVenue = async (venue) => {
  return venue.update({
    is_active: false,
  });
};

module.exports = {
  createVenue,
  findVenues,
  findVenueById,
  updateVenue,
  deactivateVenue,
};
