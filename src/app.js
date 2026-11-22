
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const healthRoutes = require("./routes/health.routes");
const userRoutes = require("./routes/user.routes");
const venueRoutes = require("./routes/venue.routes");
const { hallRouter } = require("./routes/hall.routes");
const { seatRouter, seatCategoryRouter, } = require("./routes/seat.routes");
const eventRoutes = require("./routes/event.routes");
const showRoutes = require("./routes/show.routes");
const errorHandler = require("./middlewares/error.middleware");

const app = express();

app.use(helmet());
app.use(cors());
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler must be registered last
app.use(errorHandler);

module.exports = app;
