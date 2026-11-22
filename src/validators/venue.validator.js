
const { body, param, query } = require("express-validator");

const createVenueValidator = [
  body("name")
    .isString()
    .withMessage("Venue name must be a string")
    .bail()
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage("Name must be between 2 and 150 characters"),

  body("address")
    .isString()
    .withMessage("Address must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Address is required"),

  body("city")
    .isString()
    .withMessage("City must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("City is required")
    .isLength({ max: 100 })
    .withMessage("City must not exceed 100 characters"),

  body("country")
    .optional()
    .isString()
    .withMessage("Country must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Country cannot be empty")
    .isLength({ max: 100 }),

  body("state")
    .optional({ values: "null" })
    .isString()
    .withMessage("State must be a string")
    .bail()
    .trim()
    .isLength({ max: 100 }),

  body("description")
    .optional({ values: "null" })
    .isString()
    .withMessage("Description must be a string"),

  body("postal_code")
    .optional({ values: "null" })
    .isString()
    .withMessage("Postal code must be a string")
    .bail()
    .trim()
    .isLength({ max: 20 }),

  body("latitude")
    .optional({ values: "null" })
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),

  body("longitude")
    .optional({ values: "null" })
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),

  body("is_active")
    .not()
    .exists()
    .withMessage("Use venue deactivation instead of setting is_active"),
];

const updateVenueValidator = [
  body("name")
    .optional()
    .isString()
    .bail()
    .trim()
    .isLength({ min: 2, max: 150 }),

  body("address")
    .optional()
    .isString()
    .bail()
    .trim()
    .notEmpty(),

  body("city")
    .optional()
    .isString()
    .bail()
    .trim()
    .notEmpty()
    .isLength({ max: 100 }),

  body("country")
    .optional()
    .isString()
    .bail()
    .trim()
    .notEmpty()
    .isLength({ max: 100 }),

  body("state")
    .optional({ values: "null" })
    .isString()
    .bail()
    .trim()
    .isLength({ max: 100 }),

  body("description")
    .optional({ values: "null" })
    .isString(),

  body("postal_code")
    .optional({ values: "null" })
    .isString()
    .bail()
    .trim()
    .isLength({ max: 20 }),

  body("latitude")
    .optional({ values: "null" })
    .isFloat({ min: -90, max: 90 }),

  body("longitude")
    .optional({ values: "null" })
    .isFloat({ min: -180, max: 180 }),

  body("is_active")
    .not()
    .exists()
    .withMessage("is_active cannot be updated directly"),
];

const venueIdValidator = [
  param("id")
    .isUUID()
    .withMessage("Invalid venue ID"),
];

const listVenuesValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("city")
    .optional()
    .isString()
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 }),

  query("search")
    .optional()
    .isString()
    .bail()
    .trim()
    .isLength({ min: 1, max: 150 }),

  query("is_active")
    .optional()
    .isIn(["true", "false", "all"])
    .withMessage("is_active must be true, false, or all"),
];

module.exports = {
  createVenueValidator,
  updateVenueValidator,
  venueIdValidator,
  listVenuesValidator,
};
