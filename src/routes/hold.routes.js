import express from "express";
import expressValidator from "express-validator";
import { authenticate } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import * as controller from "../controllers/hold.controller.js";

const { param } = expressValidator;

const router = express.Router();
const holdId = param("holdId").isUUID();
router.get("/:holdId", authenticate, holdId, validate, controller.getHold);
router.delete("/:holdId", authenticate, holdId, validate, controller.releaseHold);

export default router;
