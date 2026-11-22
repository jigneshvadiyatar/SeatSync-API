
const { body, param, query } = require("express-validator");

const hallIdValidator = [
  param("id")
    .isUUID()
    .withMessage("Invalid hall ID"),
];

const venueIdValidator = [
  param("venueId")
    .isUUID()
    .withMessage("Invalid venue ID"),
];

const createHallValidator = [
  body("name")
    .isString()
    .withMessage("Hall name must be a string")
    .bail()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("code")
    .isString()
    .withMessage("Hall code must be a string")
    .bail()
    .trim()
    .matches(/^[A-Za-z0-9][A-Za-z0-9_-]{1,29}$/)
    .withMessage(
      "Code must be 2-30 characters using letters, numbers, _ or -"
    ),

  body("capacity")
    .isInt({ min: 1, max: 100000 })
    .withMessage(
      "Capacity must be an integer between 1 and 100000"
    ),

  body("description")
    .optional({ values: "null" })
    .isString()
    .withMessage("Description must be a string"),

  body("floor")
    .optional({ values: "null" })
    .isString()
    .withMessage("Floor must be a string")
    .bail()
    .trim()
    .isLength({ max: 30 })
    .withMessage("Floor cannot exceed 30 characters"),

  body("venue_id")
    .not()
    .exists()
    .withMessage("Venue ID must be provided in the URL"),

  body("is_active")
    .not()
    .exists()
    .withMessage("is_active cannot be set directly"),
];

const updateHallValidator = [
  body("name")
    .optional()
    .isString()
    .bail()
    .trim()
    .isLength({ min: 2, max: 100 }),

  body("code")
    .optional()
    .isString()
    .bail()
    .trim()
    .matches(/^[A-Za-z0-9][A-Za-z0-9_-]{1,29}$/),

  body("capacity")
    .optional()
    .isInt({ min: 1, max: 100000 }),

  body("description")
    .optional({ values: "null" })
    .isString(),

  body("floor")
    .optional({ values: "null" })
    .isString()
    .bail()
    .trim()
    .isLength({ max: 30 }),

  body("venue_id")
    .not()
    .exists()
    .withMessage("Moving a hall to another venue is not supported"),

  body("is_active")
    .not()
    .exists()
    .withMessage("is_active cannot be updated directly"),
];

const listHallsValidator = [
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
    .isLength({ min: 1, max: 100 }),

  query("is_active")
    .optional()
    .isIn(["true", "false", "all"])
    .withMessage("Invalid is_active filter"),
];

module.exports = {
  hallIdValidator,
  venueIdValidator,
  createHallValidator,
  updateHallValidator,
  listHallsValidator,
};
