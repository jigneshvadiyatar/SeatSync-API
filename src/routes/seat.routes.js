
const express = require("express");

const controller = require("../controllers/seat.controller");

const {
  hallIdValidator,
  categoryIdValidator,
  seatIdValidator,
  createCategoryValidator,
  updateCategoryValidator,
  createSeatsValidator,
  updateSeatValidator,
} = require("../validators/seat.validator");

const validate = require("../middlewares/validate.middleware");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/authorize.middleware");

const hallSeatRouter = express.Router({
  mergeParams: true,
});

const seatRouter = express.Router();
const seatCategoryRouter = express.Router();

const adminOnly = [authenticate, authorize("admin")];

const optionalAuthenticate = (req, res, next) => {
  if (!req.headers.authorization) return next();
  return authenticate(req, res, next);
};

// CATEGORY ENDPOINTS

hallSeatRouter.post(
  "/seat-categories",
  ...adminOnly,
  hallIdValidator,
  createCategoryValidator,
  validate,
  controller.createCategory
);

hallSeatRouter.get(
  "/seat-categories",
  optionalAuthenticate,
  hallIdValidator,
  validate,
  controller.getCategories
);

seatCategoryRouter.patch(
  "/:id",
  ...adminOnly,
  categoryIdValidator,
  updateCategoryValidator,
  validate,
  controller.updateCategory
);

// SEAT ENDPOINTS

hallSeatRouter.post(
  "/seats/bulk",
  ...adminOnly,
  hallIdValidator,
  createSeatsValidator,
  validate,
  controller.createSeatsBulk
);

hallSeatRouter.get(
  "/seats",
  optionalAuthenticate,
  hallIdValidator,
  validate,
  controller.getSeats
);

hallSeatRouter.get(
  "/seat-layout",
  optionalAuthenticate,
  hallIdValidator,
  validate,
  controller.getSeatLayout
);

seatRouter.patch(
  "/:id",
  ...adminOnly,
  seatIdValidator,
  updateSeatValidator,
  validate,
  controller.updateSeat
);

seatRouter.delete(
  "/:id",
  ...adminOnly,
  seatIdValidator,
  validate,
  controller.deleteSeat
);

module.exports = {
  hallSeatRouter,
  seatRouter,
  seatCategoryRouter,
};
