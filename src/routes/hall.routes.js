
import express from "express";

import * as hallController from "../controllers/hall.controller.js";
import { hallSeatRouter } from "./seat.routes.js";

import { hallIdValidator, venueIdValidator, createHallValidator, updateHallValidator, listHallsValidator } from "../validators/hall.validator.js";

import validate from "../middlewares/validate.middleware.js";

import { authenticate } from "../middlewares/auth.middleware.js";

import { authorize } from "../middlewares/authorize.middleware.js";

const venueHallRouter = express.Router({
  mergeParams: true,
});

const hallRouter = express.Router();

// Public requests work without a token.
// Provided tokens must be valid.
const optionalAuthenticate = (req, res, next) => {
  if (!req.headers.authorization) {
    return next();
  }

  return authenticate(req, res, next);
};

// GET /api/v1/venues/:venueId/halls
venueHallRouter.get(
  "/",
  optionalAuthenticate,
  venueIdValidator,
  listHallsValidator,
  validate,
  hallController.getHalls
);

// POST /api/v1/venues/:venueId/halls
venueHallRouter.post(
  "/",
  authenticate,
  authorize("admin"),
  venueIdValidator,
  createHallValidator,
  validate,
  hallController.createHall
);

// Mount the hallSeatRouter for handling seat-related routes under a specific hall
hallRouter.use("/:hallId", hallSeatRouter);

// GET /api/v1/halls/:id
hallRouter.get(
  "/:id",
  optionalAuthenticate,
  hallIdValidator,
  validate,
  hallController.getHallById
);

// PATCH /api/v1/halls/:id
hallRouter.patch(
  "/:id",
  authenticate,
  authorize("admin"),
  hallIdValidator,
  updateHallValidator,
  validate,
  hallController.updateHall
);

// DELETE /api/v1/halls/:id
hallRouter.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  hallIdValidator,
  validate,
  hallController.deleteHall
);

export {
  venueHallRouter,
  hallRouter,
};
