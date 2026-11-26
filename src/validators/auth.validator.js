
import expressValidator from "express-validator";

const { body } = expressValidator;

const registerValidator = [
  body("name")
    .isString()
    .withMessage("Name must be a string")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  // FIX: Use only .isEmail() + manual toLowerCase() in service.
  // Do NOT use .normalizeEmail() — it applies opinionated transforms
  // (strips Gmail dots, removes +tags) that differ from service-side
  // normalization (trim + toLowerCase), causing login mismatches.
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .toLowerCase(),

  body("password")
    .isString()
    .withMessage("Password must be a string")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain an uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain a lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain a number")
    .matches(/[^A-Za-z0-9]/)
    .withMessage("Password must contain a special character"),
];


const loginValidator = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address"),

  body("password")
    .isString()
    .withMessage("Password is required")
    .notEmpty()
    .withMessage("Password is required"),
];


const refreshValidator = [
  body("refreshToken")
    .isString()
    .withMessage("Refresh token must be a string")
    .matches(/^[a-f0-9]{128}$/i)
    .withMessage("Invalid refresh token format"),
];



export {
  registerValidator,
  loginValidator,
  refreshValidator,
};
