import { createError } from "../utils/error.util.js";

import sequelizeLibrary from "sequelize";
import { Event } from "../models/index.js";

const { Op } = sequelizeLibrary;

const createEvent = async (data) => {
  return Event.create(data);
};

const findEventById = async (id, transaction) => {
  return Event.findByPk(id, { transaction, lock: transaction?.LOCK.UPDATE });
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
  const [updated, rows] = await Event.update(updates, {
    ...options,
    where: { id: event.id, status: event.status },
    returning: true,
  });
  if (updated === 0) {
    throw createError("Event status changed. Refresh and retry.", 409);
  }
  return rows[0];
};

export {
  createEvent,
  findEventById,
  findEventBySlug,
  findEvents,
  updateEvent,
};
