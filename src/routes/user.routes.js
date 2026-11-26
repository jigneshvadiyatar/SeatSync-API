import { listBookings } from "../controllers/booking.controller.js";
import expressValidator from "express-validator";
import { authorize } from "../middlewares/authorize.middleware.js";

import express from "express";

import * as userController from "../controllers/user.controller.js";

import { updateProfileValidator, changePasswordValidator, revokeSessionValidator } from "../validators/user.validator.js";

import validate from "../middlewares/validate.middleware.js";

import { authenticate } from "../middlewares/auth.middleware.js";

const { query } = expressValidator;

const router = express.Router();

// Protect all user profile routes
router.use(authenticate);

// Profile management
router.get("/me", userController.getProfile);
router.get(
  "/me/bookings",
  query("page").optional().isInt({ min: 1, max: 1000000 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  validate,
  listBookings
);

router.patch(
  "/me",
  updateProfileValidator,
  validate,
  userController.updateProfile
);

// Password management
router.patch(
  "/me/password",
  changePasswordValidator,
  validate,
  userController.changePassword
);

// Session management
router.get(
  "/me/sessions",
  userController.getSessions
);

router.delete(
  "/me/sessions/:sessionId",
  revokeSessionValidator,
  validate,
  userController.revokeSession
);

router.get(
  "/",
  authorize("admin"),
  query("page").optional().isInt({ min: 1, max: 1000000 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("search").optional().isString().bail().trim().isLength({ max: 100 }),
  validate,
  userController.getUsers
);

export default router;
