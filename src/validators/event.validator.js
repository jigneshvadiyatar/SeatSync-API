
const { body, param, query } = require("express-validator");

const EVENT_CATEGORIES = [
  "movie",
  "concert",
  "theatre",
  "sports",
  "other",
];

const EVENT_STATUSES = [
  "draft",
  "published",
  "archived",
  "all",
];

const eventIdValidator = [
  param("id")
    .isUUID()
    .withMessage("Invalid event ID"),
];

const createEventValidator = [
  body("title")
    .isString()
    .withMessage("Title must be a string")
    .bail()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Title must be 2-200 characters"),

  body("category")
    .isString()
    .withMessage("Category must be a string")
    .bail()
    .trim()
    .toLowerCase()
    .isIn(EVENT_CATEGORIES)
    .withMessage("Invalid event category"),

  body("description")
    .optional({ values: "null" })
    .isString()
    .withMessage("Description must be a string"),

  body("language")
    .optional({ values: "null" })
    .isString()
    .bail()
    .trim()
    .isLength({ min: 1, max: 50 }),

  body("duration_minutes")
    .optional({ values: "null" })
    .isInt({ min: 1, max: 10080 })
    .withMessage("Duration must be 1-10080 minutes"),

  body("age_rating")
    .optional({ values: "null" })
    .isString()
    .bail()
    .trim()
    .isLength({ min: 1, max: 20 }),

  body("poster_url")
    .optional({ values: "null" })
    .isURL({
      protocols: ["https"],
      require_protocol: true,
    })
    .withMessage("Poster must be a valid HTTPS URL"),

  body("banner_url")
    .optional({ values: "null" })
    .isURL({
      protocols: ["https"],
      require_protocol: true,
    })
    .withMessage("Banner must be a valid HTTPS URL"),
];

const updateEventValidator = [
  body("title")
    .optional()
    .isString()
    .bail()
    .trim()
    .isLength({ min: 2, max: 200 }),

  body("category")
    .optional()
    .isString()
    .bail()
    .trim()
    .toLowerCase()
    .isIn(EVENT_CATEGORIES),

  body("description")
    .optional({ values: "null" })
    .isString(),

  body("language")
    .optional({ values: "null" })
    .isString()
    .bail()
    .trim()
    .isLength({ min: 1, max: 50 }),

  body("duration_minutes")
    .optional({ values: "null" })
    .isInt({ min: 1, max: 10080 }),

  body("age_rating")
    .optional({ values: "null" })
    .isString()
    .bail()
    .trim()
    .isLength({ min: 1, max: 20 }),

  body("poster_url")
    .optional({ values: "null" })
    .isURL({
      protocols: ["https"],
      require_protocol: true,
    }),

  body("banner_url")
    .optional({ values: "null" })
    .isURL({
      protocols: ["https"],
      require_protocol: true,
    }),
];

const listEventsValidator = [
  query("page")
    .optional()
    .isInt({ min: 1, max: 1000000 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("search")
    .optional()
    .isString()
    .bail()
    .trim()
    .isLength({ min: 1, max: 200 }),

  query("category")
    .optional()
    .isIn(EVENT_CATEGORIES)
    .withMessage("Invalid event category"),

  query("status")
    .optional()
    .isIn(EVENT_STATUSES)
    .withMessage("Invalid event status"),
];

module.exports = {
  eventIdValidator,
  createEventValidator,
  updateEventValidator,
  listEventsValidator,
};
