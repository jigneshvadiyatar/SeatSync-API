
const { Op } = require("sequelize");
const { Event } = require("../models");

const createEvent = async (data) => {
  return Event.create(data);
};

const findEventById = async (id) => {
  return Event.findByPk(id);
};

const findEventBySlug = async (slug) => {
  return Event.findOne({
    where: { slug },
  });
};

const findEvents = async ({
  page = 1,
  limit = 10,
  search,
  category,
  status,
}) => {
  const where = {};

  if (status && status !== "all") {
    where.status = status;
  }

  if (category) {
    where.category = category;
  }

  if (search) {
    // Escape ILIKE wildcard characters in user input.
    const escaped = search.replace(
      /[\\%_]/g,
      "\\$&"
    );

    where.title = {
      [Op.iLike]: `%${escaped}%`,
    };
  }

  return Event.findAndCountAll({
    where,
    limit,
    offset: (page - 1) * limit,
    order: [
      ["createdAt", "DESC"],
      ["id", "ASC"],
    ],
  });
};

const updateEvent = async (
  event,
  updates,
  options = {}
) => {
  return event.update(updates, options);
};

module.exports = {
  createEvent,
  findEventById,
  findEventBySlug,
  findEvents,
  updateEvent,
};
