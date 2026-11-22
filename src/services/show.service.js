
const repository = require("../repositories/show.repository");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizePrices = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw createError(
      "At least one seat category price is required",
      422
    );
  }

  const seen = new Set();

  return items.map((item) => {
    const id = item.seat_category_id;

    if (seen.has(id)) {
      throw createError(
        "Duplicate seat category in price list",
        422
      );
    }

    seen.add(id);

    const price = Number(item.price);

    if (
      !Number.isFinite(price) ||
      price < 0 ||
      price > 99999999.99
    ) {
      throw createError(
        "Invalid seat category price",
        422
      );
    }

    return {
      seat_category_id: id,
      price: price.toFixed(2),
    };
  });
};


const validateCategories = async (
  priceRows,
  hallId,
  transaction
) => {
  const ids = priceRows.map(
    (item) => item.seat_category_id
  );

  const categories =
    await repository.findSeatCategoriesByIds(
      ids,
      hallId,
      transaction
    );

  if (categories.length !== ids.length) {
    throw createError(
      "One or more seat categories do not belong to this hall",
      422
    );
  }

  const allCategories =
    await repository.findAllSeatCategoriesByHallId(
      hallId,
      transaction
    );

  if (allCategories.length !== ids.length) {
    throw createError(
      "Provide a price for every seat category in this hall",
      422
    );
  }
};


const validateSchedule = (payload, existing = null) => {
  const startsAt = new Date(
    payload.starts_at !== undefined
      ? payload.starts_at
      : existing.starts_at
  );

  const endsAt = new Date(
    payload.ends_at !== undefined
      ? payload.ends_at
      : existing.ends_at
  );

  if (
    Number.isNaN(startsAt.getTime()) ||
    Number.isNaN(endsAt.getTime())
  ) {
    throw createError("Invalid show date or time", 422);
  }

  if (startsAt <= new Date()) {
    throw createError(
      "Show start time must be in the future",
      422
    );
  }

  if (endsAt <= startsAt) {
    throw createError(
      "Show end time must be after start time",
      422
    );
  }

  const bookingOpensValue =
    payload.booking_opens_at !== undefined
      ? payload.booking_opens_at
      : existing?.booking_opens_at;

  const bookingClosesValue =
    payload.booking_closes_at !== undefined
      ? payload.booking_closes_at
      : existing?.booking_closes_at;

  const hasOpening = bookingOpensValue != null;
  const hasClosing = bookingClosesValue != null;

  if (hasOpening !== hasClosing) {
    throw createError(
      "Both booking opening and closing times must be provided",
      422
    );
  }

  let bookingOpensAt = null;
  let bookingClosesAt = null;

  if (hasOpening && hasClosing) {
    bookingOpensAt = new Date(bookingOpensValue);
    bookingClosesAt = new Date(bookingClosesValue);

    if (
      Number.isNaN(bookingOpensAt.getTime()) ||
      Number.isNaN(bookingClosesAt.getTime())
    ) {
      throw createError(
        "Invalid booking window",
        422
      );
    }

    if (
      bookingOpensAt >= bookingClosesAt ||
      bookingClosesAt > startsAt
    ) {
      throw createError(
        "Booking window must close after it opens and no later than the show start",
        422
      );
    }
  }

  return {
    starts_at: startsAt,
    ends_at: endsAt,
    booking_opens_at: bookingOpensAt,
    booking_closes_at: bookingClosesAt,
  };
};

const translateDatabaseError = (error) => {
  const code =
    error.parent?.code ||
    error.original?.code;

  if (code === "23P01") {
    return createError(
      "This hall already has another show scheduled during that time",
      409
    );
  }

  if (code === "23505") {
    return createError(
      "A conflicting record already exists",
      409
    );
  }

  if (code === "23503") {
    return createError(
      "A referenced event, hall, or seat category no longer exists",
      409
    );
  }

  return error;
};

const assertAllowedFields = (payload, allowedFields) => {
  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    throw createError("Invalid request payload", 422);
  }

  const unknownFields = Object.keys(payload).filter(
    (key) => !allowedFields.includes(key)
  );

  if (unknownFields.length) {
    throw createError(
      `Unsupported fields: ${unknownFields.join(", ")}`,
      422
    );
  }
};

const assertEditable = (show) => {
  if (!show) {
    throw createError("Show not found", 404);
  }

  if (show.status !== "scheduled") {
    throw createError(
      "Only scheduled shows can be modified",
      409
    );
  }

  if (new Date(show.starts_at) <= new Date()) {
    throw createError(
      "A show that has already started cannot be modified",
      409
    );
  }
};

// CREATE SHOW
const createShow = async (payload) => {
  assertAllowedFields(payload, [
    "event_id",
    "hall_id",
    "starts_at",
    "ends_at",
    "booking_opens_at",
    "booking_closes_at",
    "seat_category_prices",
  ]);

  if (!payload.event_id || !payload.hall_id) {
    throw createError(
      "Event ID and Hall ID are required",
      422
    );
  }

  const schedule = validateSchedule(payload);
  const priceRows = normalizePrices(
    payload.seat_category_prices
  );

  try {
    return await repository.sequelize.transaction(
      async (transaction) => {
        const event = await repository.findEventById(
          payload.event_id,
          transaction,
          true
        );

        if (!event) {
          throw createError("Event not found", 404);
        }

        if (event.status === "archived") {
          throw createError(
            "Cannot schedule an archived event",
            409
          );
        }

        const hall = await repository.findHallById(
          payload.hall_id,
          transaction,
          true
        );

        if (!hall) {
          throw createError("Hall not found", 404);
        }

        if (!hall.is_active) {
          throw createError(
            "Cannot schedule a show in an inactive hall",
            409
          );
        }

        const venue = await repository.findVenueById(
          hall.venue_id,
          transaction,
          true
        );

        if (!venue || !venue.is_active) {
          throw createError(
            "Cannot schedule a show in an inactive venue",
            409
          );
        }

        await validateCategories(
          priceRows,
          hall.id,
          transaction
        );

        return repository.createShow(
          {
            event_id: event.id,
            hall_id: hall.id,
            ...schedule,
            status: "scheduled",
          },
          priceRows,
          transaction
        );
      }
    );
  } catch (error) {
    throw translateDatabaseError(error);
  }
};

// LIST SHOWS
const getShows = async (query, isAdmin = false) => {
  if (
    !isAdmin &&
    query.status &&
    query.status !== "scheduled"
  ) {
    throw createError(
      "Admin access required for this status filter",
      403
    );
  }

  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);

  let from = query.from
    ? new Date(query.from)
    : null;

  const to = query.to
    ? new Date(query.to)
    : null;

  if (from && to && to <= from) {
    throw createError(
      "The 'to' time must be later than the 'from' time",
      422
    );
  }

  if (!isAdmin) {
    const now = new Date();

    if (!from || from < now) {
      from = now;
    }
  }

  const status = isAdmin
    ? query.status && query.status !== "all"
      ? query.status
      : null
    : "scheduled";

  const { rows, count } = await repository.findShows({
    page,
    limit,
    status,
    eventId: query.event_id,
    hallId: query.hall_id,
    from,
    to,
    publishedOnly: !isAdmin,
  });

  return {
    shows: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      hasNextPage: page * limit < count,
    },
  };
};

// GET SHOW DETAILS
const getShowById = async (id, isAdmin = false) => {
  const show = await repository.findShowById(id);

  if (!show) {
    throw createError("Show not found", 404);
  }

  if (!isAdmin) {
    const isPublic =
      show.status === "scheduled" &&
      show.event.status === "published" &&
      new Date(show.starts_at) > new Date();

    if (!isPublic) {
      throw createError("Show not found", 404);
    }
  }

  return show;
};

// UPDATE SHOW TIMING / BOOKING WINDOW
const updateShow = async (id, payload) => {
  assertAllowedFields(payload, [
    "starts_at",
    "ends_at",
    "booking_opens_at",
    "booking_closes_at",
  ]);

  if (!Object.keys(payload).length) {
    throw createError(
      "At least one field is required for update",
      400
    );
  }

  try {
    return await repository.sequelize.transaction(
      async (transaction) => {
        const show = await repository.findShowRecordById(
          id,
          transaction,
          true
        );

        assertEditable(show);

        const schedule = validateSchedule(
          payload,
          show
        );

        await repository.updateShow(
          show,
          schedule,
          transaction
        );

        return repository.findShowById(id, transaction);
      }
    );
  } catch (error) {
    throw translateDatabaseError(error);
  }
};

// REPLACE ALL SHOW CATEGORY PRICES
const updateShowPrices = async (id, payload) => {
  assertAllowedFields(payload, [
    "seat_category_prices",
  ]);

  const priceRows = normalizePrices(
    payload.seat_category_prices
  );

  try {
    return await repository.sequelize.transaction(
      async (transaction) => {
        const show = await repository.findShowRecordById(
          id,
          transaction,
          true
        );

        assertEditable(show);

        await validateCategories(
          priceRows,
          show.hall_id,
          transaction
        );

        return repository.replaceShowPrices(
          show.id,
          priceRows,
          transaction
        );
      }
    );
  } catch (error) {
    throw translateDatabaseError(error);
  }
};

// CANCEL SHOW
const cancelShow = async (id) => {
  try {
    return await repository.sequelize.transaction(
      async (transaction) => {
        const show = await repository.findShowRecordById(
          id,
          transaction,
          true
        );

        assertEditable(show);

        await repository.updateShow(
          show,
          { status: "cancelled" },
          transaction
        );

        return repository.findShowById(id, transaction);
      }
    );
  } catch (error) {
    throw translateDatabaseError(error);
  }
};

module.exports = {
  createShow,
  getShows,
  getShowById,
  updateShow,
  updateShowPrices,
  cancelShow,
  validateSchedule,
validateCategories,
};
