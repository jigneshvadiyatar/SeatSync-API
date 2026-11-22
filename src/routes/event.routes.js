
const express = require("express");

const controller = require("../controllers/event.controller");

const {
  eventIdValidator,
  createEventValidator,
  updateEventValidator,
  listEventsValidator,
} = require("../validators/event.validator");

const validate = require("../middlewares/validate.middleware");

const {
  authenticate,
} = require("../middlewares/auth.middleware");

const {
  authorize,
} = require("../middlewares/authorize.middleware");

const router = express.Router();

const adminOnly = [
  authenticate,
  authorize("admin"),
];

const optionalAuthenticate = (req, res, next) => {
  if (!req.headers.authorization) {
    return next();
  }

  return authenticate(req, res, next);
};

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

module.exports = router;
