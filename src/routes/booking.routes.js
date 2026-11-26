import express from "express";
import validator from "express-validator";
import { authenticate } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import * as controller from "../controllers/booking.controller.js";

const { body, header, param, checkExact } = validator;
const router = express.Router();
const bookingId = param("id").isUUID();

router.use(authenticate);
router.post(
  "/",
  header("Idempotency-Key").matches(/^[A-Za-z0-9._:-]{1,128}$/),
  checkExact([body("holdId").isString().bail().isUUID()], { locations: ["body"] }),
  validate,
  controller.createBooking
);
router.get("/:id", bookingId, validate, controller.getBooking);
router.post("/:id/cancel", bookingId, validate, controller.cancelBooking);

export default router;
