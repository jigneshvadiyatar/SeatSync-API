
const { body, param, query } = require("express-validator");

const SHOW_STATUSES = [
  "scheduled",
  "cancelled",
  "completed",
  "all",
];

const hasTimezone = (value) =>
  /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);

const validDateTime = (value) =>
  typeof value === "string" &&
  hasTimezone(value);

const showIdValidator = [
  param("id")
    .isUUID()
    .withMessage("Invalid show ID"),
];

const createShowValidator = [
  body("event_id")
    .isUUID()
    .withMessage("Valid event ID is required"),

  body("hall_id")
    .isUUID()
    .withMessage("Valid hall ID is required"),

  body("starts_at")
    .isISO8601({ strict: true, strictSeparator: true })
    .bail()
    .custom(validDateTime)
    .withMessage("Start time must include a timezone"),

  body("ends_at")
    .isISO8601({ strict: true, strictSeparator: true })
    .bail()
    .custom(validDateTime)
    .withMessage("End time must include a timezone"),

  body("booking_opens_at")
    .optional({ values: "null" })
    .isISO8601({ strict: true, strictSeparator: true })
    .bail()
    .custom(validDateTime)
    .withMessage("Booking opening time must include a timezone"),

  body("booking_closes_at")
    .optional({ values: "null" })
    .isISO8601({ strict: true, strictSeparator: true })
    .bail()
    .custom(validDateTime)
    .withMessage("Booking closing time must include a timezone"),

  body("seat_category_prices")
    .isArray({ min: 1 })
    .withMessage("At least one category price is required"),

  body("seat_category_prices.*.seat_category_id")
    .isUUID()
    .withMessage("Invalid seat category ID"),

  body("seat_category_prices.*.price")
    .isFloat({
      min: 0,
      max: 99999999.99,
    })
    .withMessage("Price must be a non-negative number"),
];

const updateShowValidator = [
  body("starts_at")
    .optional()
    .isISO8601({ strict: true, strictSeparator: true })
    .bail()
    .custom(validDateTime),

  body("ends_at")
    .optional()
    .isISO8601({ strict: true, strictSeparator: true })
    .bail()
    .custom(validDateTime),

  body("booking_opens_at")
    .optional({ values: "null" })
    .isISO8601({ strict: true, strictSeparator: true })
    .bail()
    .custom(validDateTime),

  body("booking_closes_at")
    .optional({ values: "null" })
    .isISO8601({ strict: true, strictSeparator: true })
    .bail()
    .custom(validDateTime),
];

const showPricesValidator = [
  body("seat_category_prices")
    .isArray({ min: 1 })
    .withMessage("At least one category price is required"),

  body("seat_category_prices.*.seat_category_id")
    .isUUID()
    .withMessage("Invalid seat category ID"),

  body("seat_category_prices.*.price")
    .isFloat({
      min: 0,
      max: 99999999.99,
    })
    .withMessage("Price must be a non-negative number"),
];

const listShowsValidator = [
  query("page")
    .optional()
    .isInt({ min: 1, max: 1000000 }),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 }),

  query("event_id")
    .optional()
    .isUUID()
    .withMessage("Invalid event ID"),

  query("hall_id")
    .optional()
    .isUUID()
    .withMessage("Invalid hall ID"),

  query("status")
    .optional()
    .isIn(SHOW_STATUSES)
    .withMessage("Invalid show status"),

  query("from")
    .optional()
    .isISO8601({ strict: true, strictSeparator: true })
    .bail()
    .custom(validDateTime),

  query("to")
    .optional()
    .isISO8601({ strict: true, strictSeparator: true })
    .bail()
    .custom(validDateTime),
];

module.exports = {
  showIdValidator,
  createShowValidator,
  updateShowValidator,
  showPricesValidator,
  listShowsValidator,
};
