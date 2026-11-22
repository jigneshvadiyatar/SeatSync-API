
const { body, param } = require("express-validator");

const updateProfileValidator = [
  body("name")
    .optional()
    .isString()
    .withMessage("Name must be a string")
    .bail()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("phone_number")
    .optional({ nullable: true })
    .isString()
    .withMessage("Phone number must be a string")
    .bail()
    .trim()
    .matches(/^\+?[1-9]\d{7,14}$/)
    .withMessage("Enter a valid international phone number"),

  body("avatar_url")
    .optional({ nullable: true })
    .isURL({
      protocols: ["https"],
      require_protocol: true,
      require_tld: true,
    })
    .withMessage("Avatar must be a valid HTTPS URL"),
];

const changePasswordValidator = [
  body("currentPassword")
    .isString()
    .withMessage("Current password is required")
    .bail()
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .isString()
    .withMessage("New password is required")
    .bail()
    .isLength({ min: 8 })
    .withMessage("Password must contain at least 8 characters")
    .isByteLength({ max: 72 })
    .withMessage("Password must not exceed 72 bytes")
    .matches(/[A-Z]/)
    .withMessage("Password must contain an uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain a lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain a number")
    .matches(/[^A-Za-z0-9]/)
    .withMessage("Password must contain a special character"),
];

const revokeSessionValidator = [
  param("sessionId")
    .isUUID()
    .withMessage("Invalid session ID"),
];

module.exports = {
  updateProfileValidator,
  changePasswordValidator,
  revokeSessionValidator,
};
