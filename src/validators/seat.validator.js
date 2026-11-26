
import expressValidator from "express-validator";

const { body, param } = expressValidator;

const hallIdValidator = [
  param("hallId")
    .isUUID()
    .withMessage("Invalid hall ID"),
];

const categoryIdValidator = [
  param("id")
    .isUUID()
    .withMessage("Invalid category ID"),
];

const seatIdValidator = [
  param("id")
    .isUUID()
    .withMessage("Invalid seat ID"),
];

const createCategoryValidator = [
  body("name")
    .isString()
    .withMessage("Name must be a string")
    .bail()
    .trim()
    .isLength({ min: 2, max: 60 }),

  body("code")
    .isString()
    .withMessage("Code must be a string")
    .bail()
    .trim()
    .matches(/^[A-Za-z0-9_-]{2,30}$/)
    .withMessage("Invalid category code"),

  body("base_price")
    .isDecimal({
      decimal_digits: "0,2",
      force_decimal: false,
    })
    .withMessage("Price must have at most 2 decimal places")
    .bail()
    .custom((value) => Number(value) >= 0 &&
      Number(value) <= 99999999.99)
    .withMessage("Invalid base price"),
];

const updateCategoryValidator = [
  body("name")
    .optional()
    .isString()
    .bail()
    .trim()
    .isLength({ min: 2, max: 60 }),

  body("code")
    .optional()
    .isString()
    .bail()
    .trim()
    .matches(/^[A-Za-z0-9_-]{2,30}$/),

  body("base_price")
    .optional()
    .isDecimal({
      decimal_digits: "0,2",
      force_decimal: false,
    })
    .bail()
    .custom((value) =>
      Number(value) >= 0 &&
      Number(value) <= 99999999.99
    ),

  body("hall_id")
    .not()
    .exists()
    .withMessage("Changing category hall is not allowed"),
];

const createSeatsValidator = [
  body("rows")
    .isArray({ min: 1, max: 50 })
    .withMessage("Provide 1-50 seating rows"),

  body("rows.*.row")
    .isString()
    .bail()
    .trim()
    .matches(/^[A-Za-z]{1,10}$/)
    .withMessage("Invalid row label"),

  body("rows.*.from")
    .isInt({ min: 1, max: 100000 })
    .withMessage("Invalid starting seat number"),

  body("rows.*.to")
    .isInt({ min: 1, max: 100000 })
    .withMessage("Invalid ending seat number")
    .bail()
    .custom((value, { req, path }) => {
      const index = Number(path.match(/\[(\d+)\]/)?.[1]);

      if (!Number.isInteger(index)) return false;

      const row = req.body.rows[index];

      return (
        Number(value) >= Number(row?.from)
      );
    })
    .withMessage("Ending seat must be >= starting seat"),

  body("rows.*.categoryId")
    .isUUID()
    .withMessage("Invalid category ID"),
];

const updateSeatValidator = [
  body("category_id")
    .optional()
    .isUUID()
    .withMessage("Invalid category_id"),

  body("hall_id")
    .not()
    .exists()
    .withMessage("Moving a seat to another hall is not allowed"),

  body("row_label")
    .not()
    .exists()
    .withMessage("Changing seat position is not supported"),

  body("seat_number")
    .not()
    .exists()
    .withMessage("Changing seat position is not supported"),

  body("is_active")
    .optional()
    .isBoolean({ strict: true })
    .withMessage("is_active must be a boolean"),
];

export {
  hallIdValidator,
  categoryIdValidator,
  seatIdValidator,
  createCategoryValidator,
  updateCategoryValidator,
  createSeatsValidator,
  updateSeatValidator,
};
