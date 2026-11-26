
import expressValidator from "express-validator";

const { validationResult } = expressValidator;

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((error) => ({
        field: error.path ?? error.fields?.map((field) => field.path).join(", "),
        message: error.msg,
      })),
    });
  }

  next();
};

export default validate;
