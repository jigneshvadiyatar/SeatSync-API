
const express = require("express");

const venueController = require("../controllers/venue.controller");
const { venueHallRouter,} = require("./hall.routes");

const {
  createVenueValidator,
  updateVenueValidator,
  venueIdValidator,
  listVenuesValidator,
} = require("../validators/venue.validator");

const validate = require("../middlewares/validate.middleware");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/authorize.middleware");

const router = express.Router();

// Authentication is optional for public GET endpoints.
// If a token is supplied, it must be valid.
const optionalAuthenticate = (req, res, next) => {
  if (!req.headers.authorization) {
    return next();
  }

  return authenticate(req, res, next);
};

// PUBLIC: List active venues
// ADMIN: Can also view inactive venues
router.get(
  "/",
  optionalAuthenticate,
  listVenuesValidator,
  validate,
  venueController.getVenues
);

// Mount the venueHallRouter for handling hall-related routes under a specific venue
router.use("/:venueId/halls", venueHallRouter);

// PUBLIC: Get active venue details
// ADMIN: Can also view inactive venues
router.get(
  "/:id",
  optionalAuthenticate,
  venueIdValidator,
  validate,
  venueController.getVenueById
);

// ADMIN: Create venue
router.post(
  "/",
  authenticate,
  authorize("admin"),
  createVenueValidator,
  validate,
  venueController.createVenue
);

// ADMIN: Update venue
router.patch(
  "/:id",
  authenticate,
  authorize("admin"),
  venueIdValidator,
  updateVenueValidator,
  validate,
  venueController.updateVenue
);

// ADMIN: Soft delete venue
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  venueIdValidator,
  validate,
  venueController.deleteVenue
);

module.exports = router;
