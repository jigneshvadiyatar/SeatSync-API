import { findScheduledShows, assertHallUnreserved } from "../repositories/hold.repository.js";

import sequelizeLibrary from "sequelize";
import sequelize from "../config/database.js";
import * as repository from "../repositories/seat.repository.js";

const { UniqueConstraintError } = sequelizeLibrary;

const createError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const getHall = async (hallId, requireActive = true) => {
  const hall = await repository.findHall(hallId);

  if (!hall) {
    throw createError("Hall not found", 404);
  }

  if (
    requireActive &&
    (!hall.is_active || !hall.venue?.is_active)
  ) {
    throw createError("Hall is inactive", 409);
  }

  return hall;
};

const getActiveHallForUpdate = async (
  hallId,
  transaction
) => {
  const hall = await repository.findHallForUpdate(
    hallId,
    transaction
  );

  if (!hall) {
    throw createError("Hall not found", 404);
  }

  // Locking the parent venue ensures its active status
  // cannot change while this transaction is creating seats.
  const venue = await repository.findVenueForUpdate(hall.venue_id, transaction);

  if (!hall.is_active || !venue?.is_active) {
    throw createError("Hall or venue is inactive", 409);
  }

  return hall;
};

const normalizeCategory = (payload) => ({
  name: payload.name.trim(),
  code: payload.code.trim().toUpperCase(),
  base_price: payload.base_price,
});

const createCategory = async (hallId, payload) => {
  const data = normalizeCategory(payload);
  try {
    return await sequelize.transaction(async (transaction) => {
      await getActiveHallForUpdate(hallId, transaction);
      const shows = await findScheduledShows({ hall_id: hallId }, transaction);
      if (shows.length) {
        throw createError("Cannot add a category while this hall has scheduled shows", 409);
      }
      return repository.createCategory({ ...data, hall_id: hallId }, transaction);
    });
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      throw createError("Category code already exists", 409);
    }
    throw err;
  }
};

const getCategories = async (hallId, isAdmin = false) => {
  const hall = await getHall(hallId, false);

  if (
    !isAdmin &&
    (!hall.is_active || !hall.venue?.is_active)
  ) {
    throw createError("Hall not found", 404);
  }

  return repository.findCategories(hallId);
};

const updateCategory = async (categoryId, payload) => {
  const category = await repository.findCategory(categoryId);

  if (!category) {
    throw createError("Seat category not found", 404);
  }

  await getHall(category.hall_id);

  const updates = {};

  if (payload.name !== undefined) {
    updates.name = payload.name.trim();
  }

  if (payload.code !== undefined) {
    updates.code = payload.code.trim().toUpperCase();
  }

  if (payload.base_price !== undefined) {
    updates.base_price = payload.base_price;
  }

  if (!Object.keys(updates).length) {
    throw createError("No fields provided for update", 400);
  }

  try {
    return await repository.updateCategory(category, updates);
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      throw createError("Category code already exists", 409);
    }
    throw err;
  }
};

const createSeatsBulk = async (hallId, payload) => {
  const { rows } = payload;

  const requestedCount = rows.reduce((total, row) => total + Number(row.to) - Number(row.from) + 1, 0);
  if (requestedCount > 500) {
    throw createError("Maximum 500 seats per request", 422);
  }

  // Build the proposed seating positions before writing.
  const seats = [];

  for (const row of rows) {
    for (
      let number = Number(row.from);
      number <= Number(row.to);
      number++
    ) {
      seats.push({
        hall_id: hallId,
        category_id: row.categoryId.toLowerCase(),
        row_label: row.row.trim().toUpperCase(),
        seat_number: number,
      });
    }
  }

  // Detect duplicate positions inside the request.
  const identifiers = seats.map(
    (seat) => `${seat.row_label}:${seat.seat_number}`
  );

  if (new Set(identifiers).size !== identifiers.length) {
    throw createError("Duplicate seat positions in request", 422);
  }

  try {
    return await sequelize.transaction(async (transaction) => {
      const hall = await getActiveHallForUpdate(
        hallId,
        transaction
      );

      // FIX: Count only ACTIVE seats against capacity.
      // Deactivated seats no longer serve customers and
      // should free up capacity for new seat additions.
      const existingCount = await repository.countActiveSeats(
        hallId,
        transaction
      );

      if (existingCount + seats.length > hall.capacity) {
        throw createError(
          `Hall capacity exceeded. Available slots: ${
            hall.capacity - existingCount
          }`,
          409
        );
      }

      const categoryIds = [
        ...new Set(seats.map((seat) => seat.category_id)),
      ];

      for (const categoryId of categoryIds) {
        const category = await repository.findCategory(
          categoryId,
          { transaction }
        );

        if (!category || category.hall_id !== hall.id) {
          throw createError(
            "Seat category does not belong to this hall",
            422
          );
        }
      }

      const created = await repository.bulkCreateSeats(
        seats,
        transaction
      );

      return {
        createdCount: created.length,
        seats: created,
      };
    });
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      throw createError(
        "One or more seat positions already exist",
        409
      );
    }

    throw err;
  }
};

const getSeats = async (hallId, isAdmin = false) => {
  const hall = await getHall(hallId, false);

  if (
    !isAdmin &&
    (!hall.is_active || !hall.venue?.is_active)
  ) {
    throw createError("Hall not found", 404);
  }

  return repository.findSeats(hallId, isAdmin);
};

const getSeatLayout = async (hallId, isAdmin = false) => {
  const hall = await getHall(hallId, false);

  if (
    !isAdmin &&
    (!hall.is_active || !hall.venue?.is_active)
  ) {
    throw createError("Hall not found", 404);
  }

  const [seats, categories] = await Promise.all([
    repository.findSeats(hallId, isAdmin),
    repository.findCategories(hallId),
  ]);

  const rowMap = new Map();

  for (const seat of seats) {
    if (!rowMap.has(seat.row_label)) {
      rowMap.set(seat.row_label, []);
    }

    rowMap.get(seat.row_label).push({
      id: seat.id,
      label: `${seat.row_label}${seat.seat_number}`,
      number: seat.seat_number,
      categoryId: seat.category_id,
      category: seat.category?.name,
      basePrice: seat.category?.base_price,
      isActive: seat.is_active,
    });
  }

  return {
    hall: {
      id: hall.id,
      name: hall.name,
      capacity: hall.capacity,
    },
    categories,
    totalSeats: seats.length,
    rows: Array.from(rowMap, ([label, seats]) => ({
      label,
      seats,
    })),
  };
};

const updateSeat = async (seatId, payload) => {
  return sequelize.transaction(async (transaction) => {
    // Serialize seat-layout changes per hall.
    // Find the seat's hall before locking.
    const current = await repository.findSeat(seatId);

    if (!current) {
      throw createError("Seat not found", 404);
    }

    const hall = await getActiveHallForUpdate(current.hall_id, transaction);
    const seat = await repository.findSeatForUpdate(seatId, transaction);

    if (!seat) {
      throw createError("Seat not found", 404);
    }

    await assertHallUnreserved(hall.id, transaction);
    const updates = {};

    if (payload.category_id !== undefined) {
      const category = await repository.findCategoryInHall(
        seat.hall_id,
        payload.category_id,
        transaction
      );

      if (!category) {
        throw createError("Invalid category for this hall", 422);
      }

      updates.category_id = category.id;
    }

    // FIX: Allow reactivating a deactivated seat via PATCH.
    if (payload.is_active !== undefined) {
      if (payload.is_active && !seat.is_active) {
        const count = await repository.countActiveSeats(hall.id, transaction);
        if (count >= hall.capacity) throw createError("Hall capacity exceeded", 409);
      }
      updates.is_active = payload.is_active;
    }

    if (!Object.keys(updates).length) {
      throw createError("No fields provided for update", 400);
    }

    return repository.updateSeat(
      seat,
      updates,
      transaction
    );
  });
};

const deactivateSeat = async (seatId) => {
  return sequelize.transaction(async (transaction) => {
    const current = await repository.findSeat(seatId);

    if (!current) {
      throw createError("Seat not found", 404);
    }

    await repository.findHallForUpdate(current.hall_id, transaction);
    const seat = await repository.findSeatForUpdate(seatId, transaction);

    if (!seat) {
      throw createError("Seat not found", 404);
    }

    if (!seat.is_active) {
      throw createError("Seat is already inactive", 409);
    }

    await assertHallUnreserved(current.hall_id, transaction);
    await repository.updateSeat(
      seat,
      { is_active: false },
      transaction
    );

    return {
      message: "Seat deactivated successfully",
    };
  });
};

export {
  createCategory,
  getCategories,
  updateCategory,
  createSeatsBulk,
  getSeats,
  getSeatLayout,
  updateSeat,
  deactivateSeat,
};
