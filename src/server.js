
require("dotenv").config();

const app = require("./app");
const sequelize = require("./config/database");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL connected successfully");

    app.listen(PORT, () => {
      console.log(`SeatSync API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start SeatSync API:", error);
    process.exit(1);
  }
};

startServer();
