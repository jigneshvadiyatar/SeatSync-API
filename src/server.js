import "dotenv/config";

import app from "./app.js";
import sequelize from "./config/database.js";
import { validateEnvironment } from "./config/env.js";
import { connectRedis, disconnectRedis } from "./config/redis.js";
import { expireStaleBookings } from "./repositories/booking.repository.js";
import { expireStaleHolds } from "./repositories/hold.repository.js";

const startServer = async () => {
  validateEnvironment();
  await sequelize.authenticate();
  console.log("PostgreSQL connected successfully");

  const port = Number(process.env.PORT || 5000);
  const server = app.listen(port, () => console.log(`SeatSync API running on port ${port}`));
  server.on("error", (error) => {
    console.error("HTTP server failed to start:", error.message);
    process.exit(1);
  });

  void connectRedis().catch((error) => console.warn("Redis unavailable:", error.message));

  let sweep = null;
  const sweepExpiredHolds = () => {
    if (!sweep) {
      sweep = Promise.allSettled([expireStaleHolds(), expireStaleBookings()])
        .then((results) => {
          for (const result of results) {
            if (result.status === "rejected") console.warn("Reservation expiry sweep failed:", result.reason.message);
          }
        })
        .finally(() => { sweep = null; });
    }
  };

  sweepExpiredHolds();
  const expiryTimer = setInterval(sweepExpiredHolds, 30_000);
  expiryTimer.unref();

  const shutdown = async () => {
    clearInterval(expiryTimer);
    const deadline = setTimeout(() => process.exit(1), 10_000);
    deadline.unref();
    try {
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
      await sweep;
      await Promise.all([sequelize.close(), disconnectRedis()]);
    } catch (error) {
      console.error("Shutdown failed:", error.message);
      process.exitCode = 1;
    } finally {
      clearTimeout(deadline);
    }
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
};

startServer().catch((error) => {
  console.error("Failed to start SeatSync API:", error.message);
  process.exit(1);
});
