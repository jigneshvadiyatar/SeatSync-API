
const express = require("express");
const authController = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const {
  registerValidator,
  loginValidator,
  refreshValidator,
} = require("../validators/auth.validator");
const validate = require("../middlewares/validate.middleware");

const router = express.Router();

router.post("/register", registerValidator, validate, authController.register);
router.post("/login", loginValidator, validate, authController.login);
router.get("/me", authenticate, authController.getMe);

const { authorize } = require("../middlewares/authorize.middleware");

// Example of a protected route that requires authentication and specific roles
router.get(
  "/admin-check",
  authenticate,
  authorize("admin"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Admin access granted",
    });
  }
);

router.post(
  "/refresh",
  refreshValidator,
  validate,
  authController.refresh
);


router.post(
  "/logout",
  refreshValidator,
  validate,
  authController.logout
);

router.post(
  "/logout-all",
  authenticate,
  authController.logoutAll
);


module.exports = router;
