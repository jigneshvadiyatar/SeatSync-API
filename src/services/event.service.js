import sequelize from "../config/database.js";
import { assertEventUnreserved } from "../repositories/hold.repository.js";

import sequelizeLibrary from "sequelize";

import crypto from "node:crypto";
import * as repository from "../repositories/event.repository.js";

const {
  UniqueConstraintError,
} = sequelizeLibrary;

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const EVENT_FIELDS = [
  "title",
  "description",
  "category",
  "language",
  "duration_minutes",
  "age_rating",
  "poster_url",
  "banner_url",
];

const trimFields = new Set([
  "title",
  "description",
  "category",
  "language",
  "age_rating",
  "poster_url",
  "banner_url",
]);

const normalizeData = (payload) => {
  const result = {};

  for (const field of EVENT_FIELDS) {
    if (payload[field] === undefined) continue;

    let value = payload[field];

    if (typeof value === "string" && trimFields.has(field)) {
      value = value.trim();
    }

    if (
      typeof value === "string" &&
      ["category", "language", "age_rating"].includes(field)
    ) {
      value = value.toLowerCase();
    }

    result[field] = value;
  }

  return result;
};

const generateSlug = (title) => {
  const base = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 180)
    .replace(/-$/, "");

  const suffix = crypto.randomBytes(4).toString("hex");

  return `${base || "event"}-${suffix}`;
};

const getExistingEvent = async (id, transaction) => {
  const event = await repository.findEventById(id, transaction);

  if (!event) {
    throw createError("Event not found", 404);
  }

  return event;
};

const assertAllowedFields = (payload) => {
  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    throw createError("Invalid event payload", 422);
  }

  const unknownFields = Object.keys(payload).filter(
    (key) => !EVENT_FIELDS.includes(key)
  );

  if (unknownFields.length) {
    throw createError(
      `Unsupported event fields: ${unknownFields.join(", ")}`,
      422
    );
  }
};

// CREATE EVENT
const createEvent = async (payload) => {
  assertAllowedFields(payload);

  const data = normalizeData(payload);

  try {
    return await repository.createEvent({
      ...data,
      slug: generateSlug(data.title),
      status: "draft",
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw createError(
        "Event slug conflict. Please retry.",
        409
      );
    }

    throw error;
  }
};

// LIST EVENTS
const getEvents = async (query, isAdmin = false) => {
  if (
    !isAdmin &&
    query.status !== undefined &&
    query.status !== "published"
  ) {
    throw createError(
      "Admin access required for this status filter",
      403
    );
  }

  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);

  const status = isAdmin
    ? query.status || "all"
    : "published";

  const { rows, count } = await repository.findEvents({
    page,
    limit,
    search: query.search,
    category: query.category,
    status,
  });

  return {
    events: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      hasNextPage: page * limit < count,
    },
  };
};

// GET EVENT DETAILS
const getEventById = async (id, isAdmin = false) => {
  const event = await getExistingEvent(id);

  if (!isAdmin && event.status !== "published") {
    throw createError("Event not found", 404);
  }

  return event;
};

// UPDATE EVENT
const updateEvent = async (id, payload) => {
  assertAllowedFields(payload);

  const event = await getExistingEvent(id);

  if (event.status === "archived") {
    throw createError(
      "Archived events cannot be updated",
      409
    );
  }

  const updates = normalizeData(payload);

  if (!Object.keys(updates).length) {
    throw createError(
      "No fields provided for update",
      400
    );
  }

  return repository.updateEvent(event, updates);
};

// PUBLISH EVENT
const publishEvent = async (id) => {
  const event = await getExistingEvent(id);

  if (event.status === "archived") {
    throw createError(
      "Archived events cannot be published",
      409
    );
  }

  if (event.status === "published") {
    throw createError(
      "Event is already published",
      409
    );
  }

  return repository.updateEvent(event, {
    status: "published",
    published_at: event.published_at || new Date(),
  });
};

// UNPUBLISH EVENT
const unpublishEvent = async (id) =>
  sequelize.transaction(async (transaction) => {
    const event = await getExistingEvent(id, transaction);

    if (event.status !== "published") {
      throw createError(
        "Only published events can be unpublished",
        409
      );
    }

    await assertEventUnreserved(event.id, transaction);
    return repository.updateEvent(event, {
      status: "draft",
    }, { transaction });
  });

// ARCHIVE EVENT (SOFT DELETE)
const deleteEvent = async (id) =>
  sequelize.transaction(async (transaction) => {
    const event = await getExistingEvent(id, transaction);

    if (event.status === "archived") {
      throw createError(
        "Event is already archived",
        409
      );
    }

    await assertEventUnreserved(event.id, transaction);
    await repository.updateEvent(event, {
      status: "archived",
    }, { transaction });

    return {
      message: "Event archived successfully",
    };
  });

export {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  publishEvent,
  unpublishEvent,
  deleteEvent,
};
