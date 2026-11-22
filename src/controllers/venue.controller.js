
const venueService = require("../services/venue.service");

const createVenue = async (req, res, next) => {
  try {
    const venue = await venueService.createVenue(req.body);

    return res.status(201).json({
      success: true,
      message: "Venue created successfully",
      data: { venue },
    });
  } catch (error) {
    next(error);
  }
};

const getVenues = async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === "admin";

    const result = await venueService.getVenues(
      req.query,
      isAdmin
    );

    return res.status(200).json({
      success: true,
      message: "Venues retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getVenueById = async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === "admin";

    const venue = await venueService.getVenueById(
      req.params.id,
      isAdmin
    );

    return res.status(200).json({
      success: true,
      message: "Venue retrieved successfully",
      data: { venue },
    });
  } catch (error) {
    next(error);
  }
};

const updateVenue = async (req, res, next) => {
  try {
    const venue = await venueService.updateVenue(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Venue updated successfully",
      data: { venue },
    });
  } catch (error) {
    next(error);
  }
};

const deleteVenue = async (req, res, next) => {
  try {
    const result = await venueService.deleteVenue(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVenue,
  getVenues,
  getVenueById,
  updateVenue,
  deleteVenue,
};
