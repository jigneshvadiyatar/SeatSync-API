
import express from "express";

import * as venueController from "../controllers/venue.controller.js";
import { venueHallRouter } from "./hall.routes.js";

import { createVenueValidator, updateVenueValidator, venueIdValidator, listVenuesValidator } from "../validators/venue.validator.js";

import validate from "../middlewares/validate.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";

const router = express.Router();

import { optionalAuthenticate } from "../middlewares/optionalAuth.middleware.js";

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

export default router;
