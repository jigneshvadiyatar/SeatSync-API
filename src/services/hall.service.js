import sequelize from "../config/database.js";
import { countActiveSeats } from "../repositories/seat.repository.js";
import { assertHallUnreserved } from "../repositories/hold.repository.js";

import sequelizeLibrary from "sequelize";
import * as hallRepository from "../repositories/hall.repository.js";

const { UniqueConstraintError } = sequelizeLibrary;

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const HALL_FIELDS = [
  "name",
  "code",
  "description",
  "floor",
  "capacity",
];

const normalizeHallData = (data) => {
  const result = {};

  for (const field of HALL_FIELDS) {
    if (data[field] === undefined) continue;

    let value = data[field];

    if (typeof value === "string") {
      value = value.trim();
    }

    if (field === "code" && typeof value === "string") {
      value = value.toUpperCase();
    }

    result[field] = value;
  }

  return result;
};

const getExistingVenue = async (venueId) => {
  const venue = await hallRepository.findVenueById(venueId);

  if (!venue) {
    throw createError("Venue not found", 404);
  }

  return venue;
};

const getExistingHall = async (id, transaction) => {
  const hall = await hallRepository.findHallById(id, transaction);

  if (!hall) {
    throw createError("Hall not found", 404);
  }

  return hall;
};

const handleUniqueCodeError = (error) => {
  if (error instanceof UniqueConstraintError) {
    throw createError(
      "A hall with this code already exists in the venue",
      409
    );
  }

  throw error;
};

// CREATE
const createHall = async (venueId, payload) => {
  const venue = await getExistingVenue(venueId);

  if (!venue.is_active) {
    throw createError(
      "Cannot create a hall in an inactive venue",
      409
    );
  }

  const data = normalizeHallData(payload);

  const existingHall = await hallRepository.findHallByCode(
    venueId,
    data.code
  );

  if (existingHall) {
    throw createError(
      "A hall with this code already exists in the venue",
      409
    );
  }

  try {
    return await hallRepository.createHall({
      ...data,
      venue_id: venueId,
    });
  } catch (error) {
    handleUniqueCodeError(error);
  }
};

// LIST
const getHalls = async (venueId, query, isAdmin = false) => {
  const venue = await getExistingVenue(venueId);

  if (!isAdmin && !venue.is_active) {
    throw createError("Venue not found", 404);
  }

  if (
    !isAdmin &&
    ["false", "all"].includes(query.is_active)
  ) {
    throw createError("Admin access required", 403);
  }

  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);

  let isActive = true;

  if (isAdmin && query.is_active === "false") {
    isActive = false;
  } else if (isAdmin && query.is_active === "all") {
    isActive = undefined;
  }

  const { rows, count } =
    await hallRepository.findHallsByVenue({
      venueId,
      page,
      limit,
      search: query.search,
      isActive,
    });

  return {
    halls: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      hasNextPage: page * limit < count,
    },
  };
};

// GET BY ID
const getHallById = async (id, isAdmin = false) => {
  const hall = await getExistingHall(id);

  if (
    !isAdmin &&
    (!hall.is_active || !hall.venue?.is_active)
  ) {
    throw createError("Hall not found", 404);
  }

  return hall;
};

// UPDATE
const updateHall = async (id, payload) =>
  sequelize.transaction(async (transaction) => {
    const hall = await getExistingHall(id, transaction);

    if (!hall.is_active) {
      throw createError(
        "Cannot update an inactive hall",
        409
      );
    }

    if (!hall.venue?.is_active) {
      throw createError(
        "Cannot update a hall in an inactive venue",
        409
      );
    }

    const updates = normalizeHallData(payload);

    if (Object.keys(updates).length === 0) {
      throw createError(
        "No valid fields provided for update",
        400
      );
    }

    if (updates.code && updates.code !== hall.code) {
      const duplicate = await hallRepository.findHallByCode(
        hall.venue_id,
        updates.code
      );

      if (duplicate) {
        throw createError(
          "A hall with this code already exists in the venue",
          409
        );
      }
    }

    try {
      if (updates.capacity !== undefined && await countActiveSeats(id, transaction) > Number(updates.capacity)) {
        throw createError("Capacity cannot be lower than the active seat count", 409);
      }
      return await hallRepository.updateHall(hall, updates, transaction);
    } catch (error) {
      handleUniqueCodeError(error);
    }
  });

// SOFT DELETE
const deleteHall = async (id) =>
  sequelize.transaction(async (transaction) => {
    const hall = await getExistingHall(id, transaction);

    if (!hall.is_active) {
      throw createError("Hall is already inactive", 409);
    }

    await assertHallUnreserved(hall.id, transaction);
    await hallRepository.deactivateHall(hall, transaction);

    return {
      message: "Hall deactivated successfully",
    };
  });

export {
  createHall,
  getHalls,
  getHallById,
  updateHall,
  deleteHall,
};
