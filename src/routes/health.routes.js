import sequelize from "../config/database.js";

import express from "express";

const router = express.Router();

router.get(["/", "/live"], (req, res) => {
  return res.status(200).json({
    success: true,
    message: "SeatSync API is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

router.get("/ready", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ success: true, message: "PostgreSQL is ready" });
  } catch {
    res.status(503).json({ success: false, message: "PostgreSQL is unavailable" });
  }
});

export default router;
