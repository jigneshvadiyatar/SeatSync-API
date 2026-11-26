
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import healthRoutes from "./routes/health.routes.js";
import userRoutes from "./routes/user.routes.js";
import venueRoutes from "./routes/venue.routes.js";
import { hallRouter } from "./routes/hall.routes.js";
import { seatRouter, seatCategoryRouter } from "./routes/seat.routes.js";
import eventRoutes from "./routes/event.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import holdRoutes from "./routes/hold.routes.js";
import showRoutes from "./routes/show.routes.js";
import errorHandler from "./middlewares/error.middleware.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(morgan("dev"));

app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/venues", venueRoutes);
app.use("/api/v1/halls", hallRouter);
app.use("/api/v1/seats", seatRouter);
app.use("/api/v1/seat-categories", seatCategoryRouter);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/shows", showRoutes);
app.use("/api/v1/holds", holdRoutes);
app.use("/api/v1/bookings", bookingRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler must be registered last
app.use(errorHandler);

export default app;
