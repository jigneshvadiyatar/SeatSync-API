
import express from "express";

import expressValidator from "express-validator";
import * as holds from "../controllers/hold.controller.js";
import * as controller from "../controllers/show.controller.js";

import { showIdValidator, createShowValidator, updateShowValidator, showPricesValidator, listShowsValidator } from "../validators/show.validator.js";

import validate from "../middlewares/validate.middleware.js";

import { authenticate } from "../middlewares/auth.middleware.js";

import { authorize } from "../middlewares/authorize.middleware.js";

import { optionalAuthenticate } from "../middlewares/optionalAuth.middleware.js";

const { body, param } = expressValidator;

const router = express.Router();

const adminOnly = [
  authenticate,
  authorize("admin"),
];

// PUBLIC: List upcoming shows for published events.
// ADMIN: List shows with optional status filters.
router.get(
  "/",
  optionalAuthenticate,
  listShowsValidator,
  validate,
  controller.getShows
);

// PUBLIC: Get a published event's upcoming show.
// ADMIN: Get a show in any status.
router.get(
  "/:id",
  optionalAuthenticate,
  showIdValidator,
  validate,
  controller.getShowById
);

// ADMIN: Schedule a show.
router.post(
  "/",
  ...adminOnly,
  createShowValidator,
  validate,
  controller.createShow
);

// ADMIN: Update show timing and booking window.
router.patch(
  "/:id",
  ...adminOnly,
  showIdValidator,
  updateShowValidator,
  validate,
  controller.updateShow
);

// ADMIN: Replace all category prices for a show.
router.put(
  "/:id/prices",
  ...adminOnly,
  showIdValidator,
  showPricesValidator,
  validate,
  controller.updateShowPrices
);

// ADMIN: Cancel a future show.
router.patch(
  "/:id/cancel",
  ...adminOnly,
  showIdValidator,
  validate,
  controller.cancelShow
);

const showId = param("showId").isUUID();
router.get("/:showId/seats", optionalAuthenticate, showId, validate, holds.getShowSeats);
router.get("/:showId/availability", optionalAuthenticate, showId, validate, holds.getAvailability);
router.post(
  "/:showId/holds",
  authenticate,
  showId,
  body("seatIds").isArray({ min: 1, max: 10 }).bail(),
  body("seatIds.*").isString().bail().isUUID(),
  validate,
  holds.createHold
);

export default router;
