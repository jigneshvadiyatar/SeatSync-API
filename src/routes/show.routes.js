
const express = require("express");

const controller = require("../controllers/show.controller");

const {
  showIdValidator,
  createShowValidator,
  updateShowValidator,
  showPricesValidator,
  listShowsValidator,
} = require("../validators/show.validator");

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

module.exports = router;
