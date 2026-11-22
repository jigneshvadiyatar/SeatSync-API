
require("dotenv").config();

const database = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  dialect: "postgres",
};

module.exports = {
  development: database,
  test: {
    ...database,
    database: process.env.DB_TEST_NAME || "seatsync_test_db",
  },
  production: database,
};
