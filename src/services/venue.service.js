
const venueRepository = require("../repositories/venue.respository");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const VENUE_FIELDS = [
  "name",
  "description",
  "address",
  "city",
  "state",
  "country",
  "postal_code",
  "latitude",
  "longitude",
];

const normalizeVenueData = (data) => {
  const result = {};

  for (const field of VENUE_FIELDS) {
    if (data[field] !== undefined) {
      const value = data[field];

      result[field] =
        typeof value === "string" ? value.trim() : value;
    }
  }

  return result;
};

// CREATE VENUE
const createVenue = async (payload) => {
  const venueData = normalizeVenueData(payload);

  return venueRepository.createVenue(venueData);
};

// LIST VENUES
const getVenues = async (query, isAdmin = false) => {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);

  // Public users can only see active venues.
  let isActive = true;

  if (isAdmin && query.is_active === "false") {
    isActive = false;
  } else if (isAdmin && query.is_active === "all") {
    isActive = undefined;
  }

  if (!isAdmin && ["false", "all"].includes(query.is_active)) {
    throw createError("Admin access required for this filter", 403);
}

  const { rows, count } = await venueRepository.findVenues({
    page,
    limit,
    city: query.city,
    search: query.search,
    is_active: isActive,
  });

  return {
    venues: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      hasNextPage: page * limit < count,
    },
  };
};

// GET SINGLE VENUE
const getVenueById = async (id, isAdmin = false) => {
  const venue = await venueRepository.findVenueById(id);

  if (!venue || (!isAdmin && !venue.is_active)) {
    throw createError("Venue not found", 404);
  }

  return venue;
};

// UPDATE VENUE
const updateVenue = async (id, payload) => {
  const venue = await venueRepository.findVenueById(id);

  if (!venue) {
    throw createError("Venue not found", 404);
  }

  const updates = normalizeVenueData(payload);

  if (Object.keys(updates).length === 0) {
    throw createError("No valid fields provided for update", 400);
  }

  return venueRepository.updateVenue(venue, updates);
};

// SOFT DELETE VENUE
const deleteVenue = async (id) => {
  const venue = await venueRepository.findVenueById(id);

  if (!venue) {
    throw createError("Venue not found", 404);
  }

  if (!venue.is_active) {
    throw createError("Venue is already inactive", 409);
  }

  await venueRepository.deactivateVenue(venue);

  return {
    message: "Venue deactivated successfully",
  };
};

module.exports = {
  createVenue,
  getVenues,
  getVenueById,
  updateVenue,
  deleteVenue,
};
