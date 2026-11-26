
import { limitLogin } from "../middlewares/authRateLimit.middleware.js";
import express from "express";
import * as authController from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { registerValidator, loginValidator, refreshValidator } from "../validators/auth.validator.js";
import validate from "../middlewares/validate.middleware.js";

const router = express.Router();

router.post("/register", registerValidator, validate, authController.register);
router.post("/login", limitLogin, loginValidator, validate, authController.login);
router.get("/me", authenticate, authController.getMe);

import { authorize } from "../middlewares/authorize.middleware.js";

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


export default router;
