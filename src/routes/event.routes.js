import * as showController from "../controllers/show.controller.js";
import { listShowsValidator } from "../validators/show.validator.js";

import express from "express";

import * as controller from "../controllers/event.controller.js";

import { eventIdValidator, createEventValidator, updateEventValidator, listEventsValidator } from "../validators/event.validator.js";

import validate from "../middlewares/validate.middleware.js";

import { authenticate } from "../middlewares/auth.middleware.js";

import { authorize } from "../middlewares/authorize.middleware.js";

import { optionalAuthenticate } from "../middlewares/optionalAuth.middleware.js";

const router = express.Router();

const adminOnly = [
  authenticate,
  authorize("admin"),
];

// PUBLIC: List published events
// ADMIN: List draft, published, and archived events
router.get(
  "/",
  optionalAuthenticate,
  listEventsValidator,
  validate,
  controller.getEvents
);

// PUBLIC: View published event
// ADMIN: View any event
router.get(
  "/:id",
  optionalAuthenticate,
  eventIdValidator,
  validate,
  controller.getEventById
);

// ADMIN: Create event (draft)
router.post(
  "/",
  ...adminOnly,
  createEventValidator,
  validate,
  controller.createEvent
);

// ADMIN: Update event
router.patch(
  "/:id",
  ...adminOnly,
  eventIdValidator,
  updateEventValidator,
  validate,
  controller.updateEvent
);

// ADMIN: Publish event
router.patch(
  "/:id/publish",
  ...adminOnly,
  eventIdValidator,
  validate,
  controller.publishEvent
);

// ADMIN: Unpublish event
router.patch(
  "/:id/unpublish",
  ...adminOnly,
  eventIdValidator,
  validate,
  controller.unpublishEvent
);

// ADMIN: Archive event
router.delete(
  "/:id",
  ...adminOnly,
  eventIdValidator,
  validate,
  controller.deleteEvent
);

router.get(
  "/:id/shows",
  optionalAuthenticate,
  eventIdValidator,
  listShowsValidator,
  validate,
  showController.getEventShows
);

export default router;
