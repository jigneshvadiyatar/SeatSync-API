
const express = require("express");

const userController = require("../controllers/user.controller");

const {
  updateProfileValidator,
  changePasswordValidator,
  revokeSessionValidator,
} = require("../validators/user.validator");

const validate = require("../middlewares/validate.middleware");

const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

// Protect all user profile routes
router.use(authenticate);

// Profile management
router.get("/me", userController.getProfile);

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

module.exports = router;
