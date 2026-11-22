
const { UniqueConstraintError } = require("sequelize");
const sequelize = require("../config/database");
const repository = require("../repositories/seat.repository");

const error = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const getHall = async (hallId, requireActive = true) => {
  const hall = await repository.findHall(hallId);

  if (!hall) {
    throw error("Hall not found", 404);
  }

  if (
    requireActive &&
    (!hall.is_active || !hall.venue?.is_active)
  ) {
    throw error("Hall is inactive", 409);
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
    throw error("Hall not found", 404);
  }

  // Locking the parent venue ensures its active status
  // cannot change while this transaction is creating seats.
  const { Venue } = require("../models");

  const venue = await Venue.findByPk(hall.venue_id, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (!hall.is_active || !venue?.is_active) {
    throw error("Hall or venue is inactive", 409);
  }

  return hall;
};

const normalizeCategory = (payload) => ({
  name: payload.name.trim(),
  code: payload.code.trim().toUpperCase(),
  base_price: payload.base_price,
});

const createCategory = async (hallId, payload) => {
  await getHall(hallId);

  const data = normalizeCategory(payload);

  const existing = await repository.findCategoryByCode(
    hallId,
    data.code
  );

  if (existing) {
    throw error("Category code already exists in this hall", 409);
  }

  try {
    return await repository.createCategory({
      ...data,
      hall_id: hallId,
    });
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      throw error("Category code already exists", 409);
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
    throw error("Hall not found", 404);
  }

  return repository.findCategories(hallId);
};

const updateCategory = async (categoryId, payload) => {
  const category = await repository.findCategory(categoryId);

  if (!category) {
    throw error("Seat category not found", 404);
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
    throw error("No fields provided for update", 400);
  }

  try {
    return await repository.updateCategory(category, updates);
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      throw error("Category code already exists", 409);
    }
    throw err;
  }
};

const createSeatsBulk = async (hallId, payload) => {
  const { rows } = payload;

  // Build the proposed seating positions before writing.
  const seats = [];

  for (const row of rows) {
    for (
      let number = row.from;
      number <= row.to;
      number++
    ) {
      seats.push({
        hall_id: hallId,
        category_id: row.categoryId,
        row_label: row.row.trim().toUpperCase(),
        seat_number: number,
      });
    }
  }

  if (seats.length > 500) {
    throw error("Maximum 500 seats per request", 422);
  }

  // Detect duplicate positions inside the request.
  const identifiers = seats.map(
    (seat) => `${seat.row_label}:${seat.seat_number}`
  );

  if (new Set(identifiers).size !== identifiers.length) {
    throw error("Duplicate seat positions in request", 422);
  }

  try {
    return await sequelize.transaction(async (transaction) => {
      const hall = await getActiveHallForUpdate(
        hallId,
        transaction
      );

      const existingCount = await repository.countSeats(
        hallId,
        transaction
      );

      if (existingCount + seats.length > hall.capacity) {
        throw error(
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

        if (!category || category.hall_id !== hallId) {
          throw error(
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
      throw error(
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
    throw error("Hall not found", 404);
  }

  return repository.findSeats(hallId, isAdmin);
};

const getSeatLayout = async (hallId, isAdmin = false) => {
  const hall = await getHall(hallId, false);

  if (
    !isAdmin &&
    (!hall.is_active || !hall.venue?.is_active)
  ) {
    throw error("Hall not found", 404);
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
    const { Seat, Hall, Venue, SeatCategory } =
      require("../models");

    // Serialize seat-layout changes per hall.
    // Find the seat's hall before locking.
    const current = await repository.findSeat(seatId);

    if (!current) {
      throw error("Seat not found", 404);
    }

    const hall = await Hall.findByPk(current.hall_id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    const venue = await Venue.findByPk(hall.venue_id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!hall.is_active || !venue?.is_active) {
      throw error("Hall or venue is inactive", 409);
    }

    const seat = await Seat.findByPk(seatId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!seat) {
      throw error("Seat not found", 404);
    }

    const updates = {};

    if (payload.category_id !== undefined) {
      const category = await SeatCategory.findOne({
        where: {
          id: payload.category_id,
          hall_id: seat.hall_id,
        },
        transaction,
      });

      if (!category) {
        throw error("Invalid category for this hall", 422);
      }

      updates.category_id = category.id;
    }

    if (!Object.keys(updates).length) {
      throw error("No fields provided for update", 400);
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
    const { Seat, Hall } = require("../models");

    const current = await repository.findSeat(seatId);

    if (!current) {
      throw error("Seat not found", 404);
    }

    await Hall.findByPk(current.hall_id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    const seat = await Seat.findByPk(seatId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!seat) {
      throw error("Seat not found", 404);
    }

    if (!seat.is_active) {
      throw error("Seat is already inactive", 409);
    }

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

module.exports = {
  createCategory,
  getCategories,
  updateCategory,
  createSeatsBulk,
  getSeats,
  getSeatLayout,
  updateSeat,
  deactivateSeat,
};
